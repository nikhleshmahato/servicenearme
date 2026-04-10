const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'services.json');
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper to read data
const readServices = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper to write data
const writeServices = (services) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(services, null, 4));
};

const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4));
};

// GET all services
app.get('/api/services', (req, res) => {
    const services = readServices();
    res.json(services);
});

// POST a new service (List a Business)
app.post('/api/services', (req, res) => {
    const services = readServices();
    const { name, category, area, image, amount, description, lat, lng } = req.body || {};
    if (!name || !category || !area || !image) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const newService = {
        id: services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1,
        name,
        category,
        area,
        image,
        amount: typeof amount === 'number' ? amount : 0,
        description: description || '',
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        verified: false, // Default to false for new entries
        rating: 5.0 // Default rating
    };
    services.push(newService);
    writeServices(services);
    res.status(201).json(newService);
});

// Auth: Signup
app.post('/api/auth/signup', async (req, res) => {
    const { role, name, email, password, business } = req.body || {};
    if (!role || !['user', 'worker'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const users = readUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const user = { id, role, name, email, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    writeUsers(users);

    if (role === 'worker' && business && business.name && business.category && business.area && business.image) {
        const services = readServices();
        const newService = {
            id: services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1,
            name: business.name,
            category: business.category,
            area: business.area,
            image: business.image,
            amount: 0,
            description: '',
            verified: false,
            rating: 5.0
        };
        services.push(newService);
        writeServices(services);
    }

    res.status(201).json({ id, role, name, email });
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ id: user.id, role: user.role, name: user.name, email: user.email });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
