const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Service = require('../models/Service');

const connectDB = async () => {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/servicenearme';
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected successfully!');
        
        // Seed Database
        const count = await Service.countDocuments();
        if (count === 0) {
            console.log('Seeding Database from JSON...');
            const seedPath = path.join(__dirname, '../services.json');
            if (fs.existsSync(seedPath)) {
                const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
                await Service.insertMany(data);
                console.log('Database seeded successfully');
            }
        }
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
    }
};

module.exports = connectDB;
