const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [
        {
            productId: String,
            name:      String,
            price:     Number,
            emoji:     String,
            qty:       { type: Number, default: 1 }
        }
    ],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
