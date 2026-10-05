const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const protect = require('../middleware/protect');

router.use(protect);

// ── GET ALL ORDERS ──  GET /api/orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── PLACE ORDER (CHECKOUT) ──  POST /api/orders
router.post('/', async (req, res) => {
    try {
        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Calculate total
        const total = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);

        // Create order
        const order = await Order.create({
            user: req.user._id,
            items: cart.items,
            total,
            status: 0
        });

        // Clear the cart after ordering
        cart.items = [];
        await cart.save();

        res.status(201).json({
            message: '✅ Order placed successfully!',
            order
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
