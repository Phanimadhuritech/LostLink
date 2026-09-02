const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Electronics",
                "Documents",
                "Accessories",
                "Books",
                "Clothing",
                "Keys",
                "Wallet",
                "Other"
            ]
        },

        type: {
            type: String,
            required: true,
            enum: ["LOST", "FOUND"]
        },

        location: {
            type: String,
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        image: {
            type: String,
            default: null
        },

        images: {
            type: [String],
            default: []
        },

        verificationQuestion: {
            type: String,
            required: true
        },

        verificationAnswer: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "CLAIMED", "RETURNED"],
            default: "ACTIVE"
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes
itemSchema.index({ userId: 1 });
itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ category: 1 });

module.exports = mongoose.model("Item", itemSchema);