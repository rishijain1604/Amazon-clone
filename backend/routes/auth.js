const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/protect');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = await User.create({ name, email, password });

        res.status(201).json({
            message: 'Account created successfully!',
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            message: 'Login successful!',
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// GET PROFILE
router.get('/profile', protect, async (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;