const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    serviceId: { type: Number, required: true },
    serviceName: String,
    amount: Number,
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'confirmed' }
});

module.exports = mongoose.model('Booking', bookingSchema);
