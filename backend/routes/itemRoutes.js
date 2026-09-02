const express = require("express");
const {
    createItem,
    getItems,
    getMyItems,
    getItemById,
    updateItem,
    deleteItem,
    updateItemStatus,
    getItemMatches,
    getMyMatches
} = require("../controllers/itemController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
    validateItem,
    validateObjectId
} = require("../middleware/validationMiddleware");

const router = express.Router();

// General browse endpoint (Public)
router.get("/", getItems);

// Protected user-specific list endpoints (Must be declared before dynamic /:id paths)
router.get("/my-items", protect, getMyItems);
router.get("/matches/my-matches", protect, getMyMatches);

const uploadFields = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 5 }
]);

// Report item (Protected, supports single or multiple image uploads)
router.post("/", protect, uploadFields, validateItem, createItem);

// Single item routes
router.get("/:id", validateObjectId, getItemById);
router.put("/:id", protect, uploadFields, validateObjectId, updateItem);
router.delete("/:id", protect, validateObjectId, deleteItem);
router.put("/:id/status", protect, validateObjectId, updateItemStatus);
router.get("/:id/matches", protect, validateObjectId, getItemMatches);

module.exports = router;
