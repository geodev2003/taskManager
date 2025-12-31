const { z } = require('zod');

const registerUserSchema = z.object({
    uName: z.string().min(1).max(100),

    uEmail: z.string().email('Invalid email address'),

    uPassword: z.string().min(6).max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),

    uPhone: z.string().min(10).max(20)
    .regex(/[0-9]/, 'Phone number must contain only numbers')
});

const loginSchema = z.object({
    uEmail: z.string().email('Invalid email address'),
    uPassword: z.string().min(6).max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
});

module.exports = {
    registerUserSchema,
    loginSchema
};