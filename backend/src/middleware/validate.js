const { body, validationResult } = require('express-validator');

const nameRule = body('name')
  .trim()
  .isLength({ min: 20, max: 60 })
  .withMessage('Name must be between 20 and 60 characters');

const addressRule = body('address')
  .trim()
  .notEmpty()
  .withMessage('Address is required')
  .isLength({ max: 400 })
  .withMessage('Address must be at most 400 characters');

const emailRule = body('email')
  .trim()
  .isEmail()
  .withMessage('Please provide a valid email')
  .normalizeEmail();

const passwordRule = body('password')
  .isLength({ min: 8, max: 16 })
  .withMessage('Password must be 8-16 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must include at least one uppercase letter')
  .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/)
  .withMessage('Password must include at least one special character');

const roleRule = body('role')
  .optional()
  .isIn(['ADMIN', 'USER', 'STORE_OWNER'])
  .withMessage('Role must be ADMIN, USER, or STORE_OWNER');

const ratingRule = body('rating')
  .isInt({ min: 1, max: 5 })
  .withMessage('Rating must be an integer between 1 and 5');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = {
  nameRule,
  addressRule,
  emailRule,
  passwordRule,
  roleRule,
  ratingRule,
  validate,
  signupRules: [nameRule, emailRule, addressRule, passwordRule, validate],
  loginRules: [
    body('email').trim().isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  passwordUpdateRules: [passwordRule, validate],
  createUserRules: [nameRule, emailRule, addressRule, passwordRule, roleRule, validate],
  createStoreRules: [nameRule, emailRule, addressRule, validate],
  ratingRules: [ratingRule, validate],
};
