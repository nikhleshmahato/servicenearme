const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    serviceId: { type: Number, required: true },
    userId: { type: Number, required: true },
    userName: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
