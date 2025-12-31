const express = require('express');
const usersController = require('../controllers/users.controller');
const validate = require('../middlewares/validate');
const { registerUserSchema, loginSchema } = require('../validators/auth.schema');

const router = express.Router();

router.post('/register', validate(registerUserSchema), usersController.registerUser);

router.post('/login', validate(loginSchema), usersController.login);

module.exports = router;