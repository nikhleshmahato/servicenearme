const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: Number,
    role: String,
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    createdAt: Date
});

module.exports = mongoose.model('User', userSchema);
