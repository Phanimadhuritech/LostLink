const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
    return jwt.sign(
        {
            id: userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

// Register
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Assign role if specified, default to user
        const assignedRole = role && ["user", "admin"].includes(role) ? role : "user";

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: assignedRole
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: "Registration successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// Login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get profile
const getProfile = async (req, res, next) => {
    try {
        // req.user is already loaded in protect middleware
        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get all users (Admin only)
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });
        res.json({
            success: true,
            users
        });
    } catch (error) {
        next(error);
    }
};

// Delete user (Admin only)
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Admins cannot delete their own account."
            });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: "User deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

// Update profile
const updateProfile = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Validate email uniqueness if changed
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const existingEmail = await User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email is already registered to another account."
                });
            }
            user.email = email.toLowerCase();
        }

        if (name && name.trim()) {
            user.name = name;
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters long."
                });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    getAllUsers,
    deleteUser,
    updateProfile
};