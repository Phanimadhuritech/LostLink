const mongoose = require("mongoose");

// Helper to validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate registration data
const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    next();
};

// Validate login data
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (!password) {
        return res.status(400).json({ success: false, message: "Password is required." });
    }

    next();
};

// Validate item reporting
const validateItem = (req, res, next) => {
    const { title, description, category, type, location, date, verificationQuestion, verificationAnswer } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: "Title is required." });
    }
    if (!description || !description.trim()) {
        return res.status(400).json({ success: false, message: "Description is required." });
    }
    if (!category || !category.trim()) {
        return res.status(400).json({ success: false, message: "Category is required." });
    }

    const validCategories = [
        "Electronics",
        "Documents",
        "Accessories",
        "Books",
        "Clothing",
        "Keys",
        "Wallet",
        "Other"
    ];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
    }

    if (!type || !["LOST", "FOUND"].includes(type)) {
        return res.status(400).json({ success: false, message: "Type must be either LOST or FOUND." });
    }
    if (!location || !location.trim()) {
        return res.status(400).json({ success: false, message: "Location is required." });
    }
    if (!date) {
        return res.status(400).json({ success: false, message: "Date is required." });
    }
    if (isNaN(Date.parse(date))) {
        return res.status(400).json({ success: false, message: "Invalid date format." });
    }
    if (!verificationQuestion || !verificationQuestion.trim()) {
        return res.status(400).json({ success: false, message: "Verification question is required." });
    }
    if (!verificationAnswer || !verificationAnswer.trim()) {
        return res.status(400).json({ success: false, message: "Verification answer is required." });
    }

    next();
};

// Validate claim requests
const validateClaim = (req, res, next) => {
    const { itemId, verificationAnswer } = req.body;

    if (!itemId) {
        return res.status(400).json({ success: false, message: "Item ID is required." });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ success: false, message: "Invalid Item ID." });
    }
    if (!verificationAnswer || !verificationAnswer.trim()) {
        return res.status(400).json({ success: false, message: "Verification answer is required." });
    }

    next();
};

// Validate MongoDB ObjectId in parameters
const validateObjectId = (req, res, next) => {
    const id = req.params.id;
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID parameter format." });
    }
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateItem,
    validateClaim,
    validateObjectId
};
