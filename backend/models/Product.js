const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    category: { type: String, required: true },
    price:    { type: Number, required: true },
    original: { type: Number, required: true },
    rating:   { type: Number, default: 4.0 },
    reviews:  { type: Number, default: 0 },
    emoji:    { type: String, default: '📦' },
    desc:     { type: String, default: '' },
    createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
