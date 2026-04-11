const User = require('../models/User');
const Service = require('../models/Service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: '30d'
    });
};

exports.signup = async (req, res) => {
    try {
        const { role, name, email, password, business } = req.body || {};
        if (!role || !['user', 'worker'].includes(role) || !name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(409).json({ error: 'Email already registered' });
        
        const maxIdDoc = await User.findOne().sort('-id');
        const nextId = maxIdDoc ? maxIdDoc.id + 1 : 1;
        
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({
            id: nextId, role, name, email: email.toLowerCase(), passwordHash, createdAt: new Date()
        });
        await newUser.save();

        if (role === 'worker' && business && business.name && business.category && business.area && business.image) {
            const maxSvcDoc = await Service.findOne().sort('-id');
            const svcId = maxSvcDoc ? maxSvcDoc.id + 1 : 1;
            const newService = new Service({
                id: svcId, name: business.name, category: business.category, area: business.area,
                image: business.image, amount: 0, description: '', verified: false, rating: 5.0
            });
            await newService.save();
        }

        res.status(201).json({ 
            id: nextId, role, name, email,
            token: generateToken(newUser)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(401).json({ error: 'Invalid email or password' });
        
        res.json({ 
            id: user.id, role: user.role, name: user.name, email: user.email,
            token: generateToken(user)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
