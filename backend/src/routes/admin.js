const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { createUserRules, createStoreRules } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.post('/users', createUserRules, adminController.createUser);
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.post('/stores', createStoreRules, adminController.createStore);
router.get('/stores', adminController.listStores);

module.exports = router;
