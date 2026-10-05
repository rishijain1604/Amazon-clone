const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ── SEED PRODUCTS ── POST /api/products/seed
// This must be BEFORE the /:id route
router.get('/seed', async (req, res) => {
    try {
        await Product.deleteMany({});

        const products = [
            { name: "Samsung 4K Smart TV 55\"",     category: "electronics", price: 42999, original: 59999, rating: 4.5, reviews: 2341, emoji: "📺", desc: "Crystal clear 4K display with built-in streaming apps, voice control and HDR support." },
            { name: "Apple AirPods Pro (2nd Gen)",   category: "electronics", price: 24900, original: 29900, rating: 4.8, reviews: 8721, emoji: "🎧", desc: "Active noise cancellation, transparency mode, and up to 6 hours of listening time." },
            { name: "Sony PlayStation 5",             category: "gaming",      price: 54990, original: 59990, rating: 4.9, reviews: 5112, emoji: "🎮", desc: "Experience lightning-fast loading with 4K gaming." },
            { name: "Xbox Series X",                 category: "gaming",      price: 49990, original: 54990, rating: 4.7, reviews: 3890, emoji: "🕹️", desc: "The most powerful Xbox ever." },
            { name: "Nike Air Max 270",               category: "clothing",    price: 10995, original: 12995, rating: 4.3, reviews: 1423, emoji: "👟", desc: "Inspired by Air Max heritage, pure comfort." },
            { name: "Levi's 511 Slim Fit Jeans",     category: "clothing",    price: 2999,  original: 4999,  rating: 4.4, reviews: 3201, emoji: "👖", desc: "Slim fit jeans for everyday wear." },
            { name: "IKEA KALLAX Shelf Unit",         category: "furniture",   price: 8499,  original: 10999, rating: 4.6, reviews: 987,  emoji: "🗄️", desc: "Versatile shelving for storage and display." },
            { name: "L-Shape Office Desk",            category: "furniture",   price: 12999, original: 18000, rating: 4.2, reviews: 654,  emoji: "🪑", desc: "Spacious L-shaped desk for dual monitors." },
            { name: "Maybelline Fit Me Foundation",   category: "beauty",      price: 449,   original: 699,   rating: 4.5, reviews: 4521, emoji: "💄", desc: "Lightweight coverage with SPF 18." },
            { name: "The Ordinary Niacinamide Serum", category: "beauty",      price: 599,   original: 850,   rating: 4.7, reviews: 7812, emoji: "🧴", desc: "10% Niacinamide reduces blemishes." },
            { name: "Royal Canin Dog Food 10kg",      category: "pets",        price: 3499,  original: 4200,  rating: 4.8, reviews: 2109, emoji: "🐕", desc: "Complete nutrition for adult dogs." },
            { name: "Cat Scratching Tree Tower",      category: "pets",        price: 2199,  original: 3500,  rating: 4.4, reviews: 876,  emoji: "🐱", desc: "Multi-level cat tree with scratching posts." },
            { name: "Logitech MX Master 3 Mouse",     category: "electronics", price: 8995,  original: 10999, rating: 4.8, reviews: 6234, emoji: "🖱️", desc: "Advanced wireless mouse with ultra-fast scrolling." },
            { name: "Mechanical Gaming Keyboard",     category: "gaming",      price: 5499,  original: 7999,  rating: 4.6, reviews: 1876, emoji: "⌨️", desc: "RGB mechanical keyboard with anti-ghosting." },
            { name: "Men's Casual Shirt (Pack of 3)", category: "clothing",    price: 1299,  original: 2499,  rating: 4.1, reviews: 3456, emoji: "👔", desc: "Premium cotton shirts for everyday wear." },
            { name: "Wooden Coffee Table",            category: "furniture",   price: 6999,  original: 9500,  rating: 4.3, reviews: 432,  emoji: "🪵", desc: "Solid wood table for your living space." },
        ];

        await Product.insertMany(products);
        res.json({ message: `✅ ${products.length} products seeded successfully!` });

    } catch (err) {
        res.status(500).json({ message: 'Seed error: ' + err.message });
    }
});

// ── GET ALL PRODUCTS ──  GET /api/products
router.get('/', async (req, res) => {
    try {
        const { category, sort, search } = req.query;
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        let products = await Product.find(query);

        if (sort === 'price-low')  products.sort((a, b) => a.price - b.price);
        if (sort === 'price-high') products.sort((a, b) => b.price - a.price);
        if (sort === 'rating')     products.sort((a, b) => b.rating - a.rating);

        res.json({ products });
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ── GET SINGLE PRODUCT ──  GET /api/products/:id
// This must be AFTER /seed
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ product });
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;