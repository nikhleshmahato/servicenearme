const express = require('express');
const router = express.Router();
const { addReview, getServiceReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addReview);
router.get('/:serviceId', getServiceReviews);

module.exports = router;
