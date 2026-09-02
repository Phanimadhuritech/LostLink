const express = require("express");
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validationMiddleware");

const router = express.Router();

// Retrieve all notifications
router.get("/", protect, getNotifications);

// Bulk read mark (Must be declared before dynamic /:id paths)
router.put("/read-all", protect, markAllAsRead);

// Single notification operations
router.put("/:id/read", protect, validateObjectId, markAsRead);
router.delete("/:id", protect, validateObjectId, deleteNotification);

module.exports = router;
