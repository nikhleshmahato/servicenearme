const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    id: Number,
    name: String,
    category: String,
    area: String,
    rating: Number,
    lat: Number,
    lng: Number,
    image: String,
    verified: Boolean,
    amount: Number,
    description: String
});

module.exports = mongoose.model('Service', serviceSchema);
