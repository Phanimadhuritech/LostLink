const Notification = require("../models/Notification");

// Get all notifications for current user
const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("itemId", "title type status")
            .populate("claimId", "status")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        next(error);
    }
};

// Mark single notification as read
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        // Verify recipient ownership
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to modify this notification."
            });
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            success: true,
            message: "Notification marked as read.",
            notification
        });
    } catch (error) {
        next(error);
    }
};

// Mark all user notifications as read
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({
            success: true,
            message: "All notifications marked as read."
        });
    } catch (error) {
        next(error);
    }
};

// Delete notification
const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        // Verify ownership
        if (notification.recipient.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this notification."
            });
        }

        await Notification.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Notification deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
