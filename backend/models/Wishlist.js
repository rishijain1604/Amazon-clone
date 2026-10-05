const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
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
            emoji:     String
        }
    ]
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
