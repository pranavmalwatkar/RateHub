const express = require('express');
const ownerController = require('../controllers/ownerController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('STORE_OWNER'));
router.get('/dashboard', ownerController.dashboard);

module.exports = router;
