const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'servicenearme_secret_key_123';

const protect = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

module.exports = { protect, JWT_SECRET };
