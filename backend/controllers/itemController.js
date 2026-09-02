const Item = require("../models/Item");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

// Custom matching algorithm helper
const findMatchesForItem = async (item) => {
    const oppositeType = item.type === "LOST" ? "FOUND" : "LOST";
    
    // Find active opposite items in same category, excluding own items
    const candidates = await Item.find({
        type: oppositeType,
        category: item.category,
        status: "ACTIVE",
        userId: { $ne: item.userId },
        _id: { $ne: item._id }
    }).select("-verificationAnswer").populate("userId", "name email");

    const matches = [];

    for (const cand of candidates) {
        let score = 0;
        // Guaranteed category match
        score += 20;

        // Extract and compare unique keywords from title and description
        const stopWords = new Set(["the", "and", "for", "with", "lost", "found", "this", "that", "from", "near", "your", "items", "item"]);
        
        const extractKeywords = (str) => {
            return new Set(
                (str || "").toLowerCase()
                    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
                    .split(/\s+/)
                    .filter(w => w.length > 2 && !stopWords.has(w))
            );
        };

        const itemKeywords = extractKeywords(`${item.title} ${item.description}`);
        const candKeywords = extractKeywords(`${cand.title} ${cand.description}`);

        let commonWordsCount = 0;
        for (const kw of itemKeywords) {
            if (candKeywords.has(kw)) {
                commonWordsCount++;
            }
        }

        score += commonWordsCount * 12;

        // Substring location match
        const loc1 = (item.location || "").toLowerCase();
        const loc2 = (cand.location || "").toLowerCase();
        if (loc1 && loc2 && (loc1.includes(loc2) || loc2.includes(loc1))) {
            score += 20;
        }

        // Date proximity
        const dateDiff = Math.abs(new Date(item.date) - new Date(cand.date));
        const diffInDays = dateDiff / (1000 * 60 * 60 * 24);

        if (diffInDays <= 1) {
            score += 25;
        } else if (diffInDays <= 3) {
            score += 15;
        } else if (diffInDays <= 7) {
            score += 10;
        } else if (diffInDays <= 14) {
            score += 5;
        }

        // Add to matching list if threshold is met
        if (score >= 30) {
            matches.push({
                item: cand,
                score
            });
        }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
};

// Create lost/found item
const createItem = async (req, res, next) => {
    try {
        const {
            title,
            description,
            category,
            type,
            location,
            date,
            verificationQuestion,
            verificationAnswer
        } = req.body;

        let images = [];
        if (req.files) {
            if (req.files.images) {
                images = req.files.images.map(file => `/uploads/${file.filename}`);
            } else if (req.files.image) {
                images = [`/uploads/${req.files.image[0].filename}`];
            }
        } else if (req.file) {
            images = [`/uploads/${req.file.filename}`];
        }

        const image = images.length > 0 ? images[0] : null;

        const item = await Item.create({
            title,
            description,
            category,
            type,
            location,
            date,
            image,
            images,
            verificationQuestion,
            verificationAnswer,
            userId: req.user._id
        });

        // Trigger potential matching search
        const matches = await findMatchesForItem(item);
        
        // Notify both parties if matches are found (limit notifications to top 3 matches to avoid spam)
        const notifyCount = Math.min(matches.length, 3);
        for (let i = 0; i < notifyCount; i++) {
            const cand = matches[i].item;
            
            // Notify claimant
            await Notification.create({
                recipient: cand.userId._id,
                type: "MATCH",
                message: `Potential Match: A new reported ${item.type.toLowerCase()} item "${item.title}" might match your "${cand.title}".`,
                itemId: cand._id
            });

            // Notify reporter of current item
            await Notification.create({
                recipient: item.userId,
                type: "MATCH",
                message: `Potential Match: Your reported "${item.title}" matches a reported ${cand.type.toLowerCase()} item "${cand.title}".`,
                itemId: item._id
            });
        }

        res.status(201).json({
            success: true,
            message: "Item reported successfully.",
            item
        });
    } catch (error) {
        next(error);
    }
};

// Get all items with search, filters, pagination
const getItems = async (req, res, next) => {
    try {
        const {
            search,
            category,
            type,
            location,
            status,
            dateStart,
            dateEnd,
            page = 1,
            limit = 12
        } = req.query;

        const filter = {};

        // Default: display only ACTIVE items unless filtered
        if (status) {
            filter.status = status;
        } else {
            filter.status = "ACTIVE";
        }

        if (type) {
            filter.type = type;
        }

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        if (location) {
            filter.location = { $regex: location, $options: "i" };
        }

        if (dateStart || dateEnd) {
            filter.date = {};
            if (dateStart) filter.date.$gte = new Date(dateStart);
            if (dateEnd) filter.date.$lte = new Date(dateEnd);
        }

        const skip = (page - 1) * limit;

        const total = await Item.countDocuments(filter);
        const items = await Item.find(filter)
            .select("-verificationAnswer")
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            items
        });
    } catch (error) {
        next(error);
    }
};

// Get current user's items
const getMyItems = async (req, res, next) => {
    try {
        const items = await Item.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({
            success: true,
            items
        });
    } catch (error) {
        next(error);
    }
};

// Get item by ID
const getItemById = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id).populate("userId", "name email");

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        const itemObj = item.toObject();

        // Check if requester is owner or admin
        let isOwnerOrAdmin = false;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded && (decoded.id === item.userId._id.toString() || decoded.role === "admin")) {
                    isOwnerOrAdmin = true;
                }
            } catch (e) {
                // Ignore invalid token on public view
            }
        }

        if (!isOwnerOrAdmin) {
            delete itemObj.verificationAnswer;
        }

        res.json({
            success: true,
            item: itemObj
        });
    } catch (error) {
        next(error);
    }
};

// Update item (owner or admin)
const updateItem = async (req, res, next) => {
    try {
        let item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        // Authorization check: owner or admin
        if (item.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to edit this report."
            });
        }

        const {
            title,
            description,
            category,
            type,
            location,
            date,
            verificationQuestion,
            verificationAnswer,
            status
        } = req.body;

        item.title = title || item.title;
        item.description = description || item.description;
        item.category = category || item.category;
        item.type = type || item.type;
        item.location = location || item.location;
        item.date = date ? new Date(date) : item.date;
        item.verificationQuestion = verificationQuestion || item.verificationQuestion;
        item.verificationAnswer = verificationAnswer || item.verificationAnswer;
        item.status = status || item.status;

        let newImages = [];
        if (req.files) {
            if (req.files.images) {
                newImages = req.files.images.map(file => `/uploads/${file.filename}`);
            } else if (req.files.image) {
                newImages = [`/uploads/${req.files.image[0].filename}`];
            }
        } else if (req.file) {
            newImages = [`/uploads/${req.file.filename}`];
        }

        if (newImages.length > 0) {
            item.images = newImages;
            item.image = newImages[0];
        }

        const updatedItem = await item.save();

        res.json({
            success: true,
            message: "Item updated successfully.",
            item: updatedItem
        });
    } catch (error) {
        next(error);
    }
};

// Delete item (owner or admin)
const deleteItem = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        // Authorization check: owner or admin
        if (item.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this report."
            });
        }

        await Item.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Item report deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

// Update item status directly (owner only)
const updateItemStatus = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        if (item.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the reporter can change status directly."
            });
        }

        const { status } = req.body;
        if (!status || !["ACTIVE", "CLAIMED", "RETURNED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value."
            });
        }

        item.status = status;
        await item.save();

        // If returned, send notification to any claimant whose claims are approved
        if (status === "RETURNED") {
            await Notification.create({
                recipient: item.userId,
                type: "ITEM_RETURNED",
                message: `Congratulations! Your item "${item.title}" is marked as returned.`,
                itemId: item._id
            });
        }

        res.json({
            success: true,
            message: `Item status updated to ${status}.`,
            item
        });
    } catch (error) {
        next(error);
    }
};

// Get potential matches for a specific item
const getItemMatches = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        const matches = await findMatchesForItem(item);
        res.json({
            success: true,
            matches
        });
    } catch (error) {
        next(error);
    }
};

// Get all matches for user's items
const getMyMatches = async (req, res, next) => {
    try {
        const items = await Item.find({ userId: req.user._id, status: "ACTIVE" });
        const results = [];

        for (const item of items) {
            const matches = await findMatchesForItem(item);
            if (matches.length > 0) {
                results.push({
                    item,
                    matches
                });
            }
        }

        res.json({
            success: true,
            results
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createItem,
    getItems,
    getMyItems,
    getItemById,
    updateItem,
    deleteItem,
    updateItemStatus,
    getItemMatches,
    getMyMatches
};
