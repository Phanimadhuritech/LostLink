const Claim = require("../models/Claim");
const Item = require("../models/Item");
const Notification = require("../models/Notification");

// Create a claim
const createClaim = async (req, res, next) => {
    try {
        const { itemId, verificationAnswer } = req.body;

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        // Prevent owner from claiming their own item
        if (item.userId.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot claim your own reported item."
            });
        }

        // Prevent claiming an item that is already claimed/returned
        if (item.status !== "ACTIVE") {
            return res.status(400).json({
                success: false,
                message: "This item is no longer active or has already been claimed."
            });
        }

        // Check if user already has an active claim for this item
        const existingClaim = await Claim.findOne({
            itemId,
            claimerId: req.user._id,
            status: { $in: ["PENDING", "APPROVED"] }
        });

        if (existingClaim) {
            return res.status(400).json({
                success: false,
                message: "You already have an active or approved claim for this item."
            });
        }

        // String normalization for verification
        const normalize = (str) => {
            return (str || "")
                .toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        };

        const userAns = normalize(verificationAnswer);
        const targetAns = normalize(item.verificationAnswer);

        // Verification matching
        const isMatch = userAns.length > 0 && targetAns.length > 0 && (
            userAns === targetAns ||
            (targetAns.length >= 3 && userAns.includes(targetAns)) ||
            (userAns.length >= 3 && targetAns.includes(userAns))
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Verification failed: The provided answer does not match the item's verification records."
            });
        }

        // Approved verification claim
        const claim = await Claim.create({
            itemId,
            claimerId: req.user._id,
            verificationAnswer,
            status: "APPROVED",
            feedback: "Ownership verified successfully."
        });

        // Update item status to CLAIMED
        item.status = "CLAIMED";
        await item.save();

        // Reject other pending claims if any
        await Claim.updateMany(
            { itemId: item._id, _id: { $ne: claim._id }, status: "PENDING" },
            { $set: { status: "REJECTED", feedback: "Another claim was approved for this item." } }
        );

        // Notify item owner
        await Notification.create({
            recipient: item.userId,
            type: "CLAIM_REQUEST",
            message: `Claim Verified: User "${req.user.name}" successfully answered the verification question for "${item.title}".`,
            itemId: item._id,
            claimId: claim._id
        });

        // Notify claimer
        await Notification.create({
            recipient: req.user._id,
            type: "CLAIM_STATUS",
            message: `Verification Successful: Your claim for item "${item.title}" has been approved!`,
            itemId: item._id,
            claimId: claim._id
        });

        res.status(201).json({
            success: true,
            message: "Ownership verified! Claim approved successfully.",
            claim
        });
    } catch (error) {
        next(error);
    }
};

// Get claims submitted by the current user
const getMyClaims = async (req, res, next) => {
    try {
        const claims = await Claim.find({ claimerId: req.user._id })
            .populate("itemId")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            claims
        });
    } catch (error) {
        next(error);
    }
};

// Get claims received for items posted by the current user
const getReceivedClaims = async (req, res, next) => {
    try {
        // Find items reported by this user
        const items = await Item.find({ userId: req.user._id });
        const itemIds = items.map(item => item._id);

        const claims = await Claim.find({ itemId: { $in: itemIds } })
            .populate("itemId")
            .populate("claimerId", "name email")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            claims
        });
    } catch (error) {
        next(error);
    }
};

// Get all claims for a specific item (only for the item owner)
const getItemClaims = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        // Only owner can view claims on their item
        if (item.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view claims for this item."
            });
        }

        const claims = await Claim.find({ itemId: req.params.itemId })
            .populate("claimerId", "name email")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            claims
        });
    } catch (error) {
        next(error);
    }
};

// Update claim status (Approve / Reject) (only by the item owner)
const updateClaimStatus = async (req, res, next) => {
    try {
        const { status, feedback } = req.body;

        if (!status || !["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value. Must be APPROVED or REJECTED."
            });
        }

        const claim = await Claim.findById(req.params.id).populate("itemId");
        if (!claim) {
            return res.status(404).json({
                success: false,
                message: "Claim not found."
            });
        }

        const item = claim.itemId;

        // Verify that the current user is the owner of the item
        if (item.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to decide this claim."
            });
        }

        // Check if claim is already decided
        if (claim.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: `This claim has already been ${claim.status.toLowerCase()}.`
            });
        }

        // Update claim
        claim.status = status;
        claim.feedback = feedback || "";
        await claim.save();

        // If approved, mark the item as CLAIMED (or RETURNED) and reject all other pending claims on this item
        if (status === "APPROVED") {
            item.status = "CLAIMED";
            await item.save();

            // Reject all other pending claims for this item
            await Claim.updateMany(
                { itemId: item._id, _id: { $ne: claim._id }, status: "PENDING" },
                { $set: { status: "REJECTED", feedback: "Another claim was approved for this item." } }
            );

            // Notify claimant
            await Notification.create({
                recipient: claim.claimerId,
                type: "CLAIM_STATUS",
                message: `Claim Approved: Your claim for item "${item.title}" was approved by the owner.`,
                itemId: item._id,
                claimId: claim._id
            });
        } else {
            // Notify claimant of rejection
            await Notification.create({
                recipient: claim.claimerId,
                type: "CLAIM_STATUS",
                message: `Claim Rejected: Your claim for item "${item.title}" was rejected by the owner.`,
                itemId: item._id,
                claimId: claim._id
            });
        }

        res.json({
            success: true,
            message: `Claim status updated to ${status}.`,
            claim
        });
    } catch (error) {
        next(error);
    }
};

// Admin route to get all claims
const getAllClaims = async (req, res, next) => {
    try {
        const claims = await Claim.find({})
            .populate("itemId")
            .populate("claimerId", "name email")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            claims
        });
    } catch (error) {
        next(error);
    }
};

// Cancel/Delete a claim (claimer can cancel, admin can delete)
const deleteClaim = async (req, res, next) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) {
            return res.status(404).json({
                success: false,
                message: "Claim not found."
            });
        }

        // Permission check: claimant or admin
        if (claim.claimerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete or cancel this claim."
            });
        }

        await Claim.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Claim cancelled/deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createClaim,
    getMyClaims,
    getReceivedClaims,
    getItemClaims,
    updateClaimStatus,
    getAllClaims,
    deleteClaim
};
