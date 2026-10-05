const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            productId: String,
            name:      String,
            price:     Number,
            qty:       Number,
            emoji:     String
        }
    ],
    total:  { type: Number, required: true },
    status: { type: Number, default: 0 },   // 0=Ordered 1=Shipped 2=Out for Delivery 3=Delivered
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
