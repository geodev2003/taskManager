const usersService = require('../services/users.service');

async function registerUser(req, res, next) {
    try {
        const userId = await usersService.createUser(req.body);
        res.status(201).json({ message: 'User created successfully', data: { userId } });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { uEmail, uPassword } = req.body;
        const result = await usersService.loginUser({ uEmail, uPassword });

        res.status(200).json({ message: 'Login successful', ...result });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    registerUser,
    login
};