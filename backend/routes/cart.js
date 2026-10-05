const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const protect = require('../middleware/protect');

// All cart routes require login
router.use(protect);

// ── GET CART ──  GET /api/cart
router.get('/', async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        res.json({ items: cart ? cart.items : [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── ADD TO CART ──  POST /api/cart
router.post('/', async (req, res) => {
    try {
        const { productId, name, price, emoji } = req.body;
        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        const existing = cart.items.find(i => i.productId === productId);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.items.push({ productId, name, price, emoji, qty: 1 });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        res.json({ message: 'Added to cart', items: cart.items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── UPDATE QUANTITY ──  PUT /api/cart/:productId
router.put('/:productId', async (req, res) => {
    try {
        const { qty } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.find(i => i.productId === req.params.productId);
        if (!item) return res.status(404).json({ message: 'Item not in cart' });

        if (qty <= 0) {
            cart.items = cart.items.filter(i => i.productId !== req.params.productId);
        } else {
            item.qty = qty;
        }

        await cart.save();
        res.json({ message: 'Cart updated', items: cart.items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── REMOVE ITEM ──  DELETE /api/cart/:productId
router.delete('/:productId', async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(i => i.productId !== req.params.productId);
        await cart.save();
        res.json({ message: 'Item removed', items: cart.items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── CLEAR CART ──  DELETE /api/cart
router.delete('/', async (req, res) => {
    try {
        await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
