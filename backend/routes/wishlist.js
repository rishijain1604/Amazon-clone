const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const protect = require('../middleware/protect');

router.use(protect);

// ── GET WISHLIST ──  GET /api/wishlist
router.get('/', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        res.json({ items: wishlist ? wishlist.items : [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── TOGGLE WISHLIST ITEM ──  POST /api/wishlist
router.post('/', async (req, res) => {
    try {
        const { productId, name, price, emoji } = req.body;
        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, items: [] });
        }

        const idx = wishlist.items.findIndex(i => i.productId === productId);
        let action = '';

        if (idx >= 0) {
            wishlist.items.splice(idx, 1);
            action = 'removed';
        } else {
            wishlist.items.push({ productId, name, price, emoji });
            action = 'added';
        }

        await wishlist.save();
        res.json({ message: `Item ${action} from wishlist`, items: wishlist.items, action });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
