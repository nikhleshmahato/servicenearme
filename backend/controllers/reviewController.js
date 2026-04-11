const Review = require('../models/Review');
const Service = require('../models/Service');

exports.addReview = async (req, res) => {
    try {
        const { serviceId, rating, comment } = req.body;
        const newReview = new Review({
            serviceId,
            userId: req.user.id,
            userName: req.user.name,
            rating,
            comment
        });
        await newReview.save();

        // Update service rating (average)
        const reviews = await Review.find({ serviceId });
        const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
        await Service.updateOne({ id: serviceId }, { $set: { rating: avgRating.toFixed(1) } });

        res.status(201).json(newReview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getServiceReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ serviceId: req.params.serviceId }).sort('-createdAt');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
