const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const serviceRoutes = require('./routes/serviceRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database
connectDB();

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// Serve static React files directly in Production
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// React app catch-all fallback
app.use((req, res, next) => {
    // If it's an API call that wasn't handled, return 404
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Otherwise serve index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
