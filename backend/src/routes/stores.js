const express = require('express');
const storeController = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { ratingRules } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorize('USER', 'ADMIN'));

router.get('/', storeController.listStores);
router.post('/:storeId/ratings', ratingRules, storeController.submitOrUpdateRating);
router.put('/:storeId/ratings', ratingRules, storeController.submitOrUpdateRating);

module.exports = router;
