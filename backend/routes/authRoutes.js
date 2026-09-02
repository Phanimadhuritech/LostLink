const express = require("express");
const {
    register,
    login,
    getProfile,
    getAllUsers,
    deleteUser,
    updateProfile
} = require("../controllers/authController");
const { protect, admin } = require("../middleware/authMiddleware");
const {
    validateRegister,
    validateLogin,
    validateObjectId
} = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, validateObjectId, deleteUser);

module.exports = router;