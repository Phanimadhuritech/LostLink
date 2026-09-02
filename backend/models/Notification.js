const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: ["MATCH", "CLAIM_REQUEST", "CLAIM_STATUS", "ITEM_RETURNED"],
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item"
        },

        claimId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Claim"
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Indexes
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
