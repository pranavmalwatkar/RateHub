const express = require('express');
const authController = require('../controllers/authController');
const { signupRules, loginRules, passwordUpdateRules } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signupRules, authController.signup);
router.post('/login', loginRules, authController.login);
router.get('/me', authenticate, authController.me);
router.put('/password', authenticate, passwordUpdateRules, authController.updatePassword);

module.exports = router;
