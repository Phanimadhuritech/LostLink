const express = require("express");
const {
    createClaim,
    getMyClaims,
    getReceivedClaims,
    getItemClaims,
    updateClaimStatus,
    getAllClaims,
    deleteClaim
} = require("../controllers/claimController");
const { protect, admin } = require("../middleware/authMiddleware");
const {
    validateClaim,
    validateObjectId
} = require("../middleware/validationMiddleware");

const router = express.Router();

// Get claims (Requires authentication)
router.get("/my-claims", protect, getMyClaims);
router.get("/received", protect, getReceivedClaims);
router.get("/item/:itemId", protect, validateObjectId, getItemClaims);

// Submit claim
router.post("/", protect, validateClaim, createClaim);

// Manage claim (Approve/Reject or Cancel)
router.put("/:id", protect, validateObjectId, updateClaimStatus);
router.delete("/:id", protect, validateObjectId, deleteClaim);

// Admin-only list
router.get("/", protect, admin, getAllClaims);

module.exports = router;
