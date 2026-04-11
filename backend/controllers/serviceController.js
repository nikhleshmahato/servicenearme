const Service = require('../models/Service');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

exports.getServices = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) throw new Error("MongoDB offline");
        const services = await Service.find({});
        res.json(services);
    } catch (err) {
        console.log("Fallback to local JSON due to DB error:", err.message);
        const fallbackPath = path.join(__dirname, '../../frontend/src/services.json');
        if (fs.existsSync(fallbackPath)) {
            const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
            return res.json(data);
        }
        res.status(500).json({ error: err.message });
    }
};

exports.createService = async (req, res) => {
    try {
        const { name, category, area, image, amount, description, lat, lng } = req.body || {};
        if (!name || !category || !area || !image) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const maxIdDoc = await Service.findOne().sort('-id');
        const nextId = maxIdDoc ? maxIdDoc.id + 1 : 1;
        
        const newService = new Service({
            id: nextId,
            name, category, area, image,
            amount: typeof amount === 'number' ? amount : 0,
            description: description || '',
            lat, lng,
            verified: false,
            rating: 5.0
        });
        await newService.save();
        res.status(201).json(newService);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
