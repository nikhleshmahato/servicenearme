const Booking = require('../models/Booking');

exports.createBooking = async (req, res) => {
    try {
        const { serviceId, serviceName, amount } = req.body;
        const newBooking = new Booking({
            userId: req.user.id,
            serviceId,
            serviceName,
            amount
        });
        await newBooking.save();
        res.status(201).json(newBooking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id }).sort('-date');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
