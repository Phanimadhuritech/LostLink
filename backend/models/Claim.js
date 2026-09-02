const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
    {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        claimerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        verificationAnswer: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING"
        },

        feedback: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Indexes
claimSchema.index({ itemId: 1 });
claimSchema.index({ claimerId: 1 });

module.exports = mongoose.model("Claim", claimSchema);
