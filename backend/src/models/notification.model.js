const { sql, pool } = require('../config/db');

const NotificationModel = {
    saveSubscription: async (uId, subscription) => {
        try {
            const request = pool.request();
            request.input('uId', sql.Int, uId);
            request.input('endpoint', sql.NVarChar(sql.MAX), subscription.endpoint);
            request.input('p256dh', sql.NVarChar(sql.MAX), subscription.keys.p256dh);
            request.input('auth', sql.NVarChar(sql.MAX), subscription.keys.auth);

            // Check if subscription exists for this user and endpoint to avoid duplicates
            // Or just insert, assuming frontend manages subscription uniqueness per browser
            // A simple check is good.
            const checkQuery = `
                SELECT sId FROM subscriptions 
                WHERE uId = @uId AND sEndpoint = @endpoint
            `;
            const result = await request.query(checkQuery);

            if (result.recordset.length === 0) {
                const insertQuery = `
                    INSERT INTO subscriptions (uId, sEndpoint, sKeysP256dh, sKeysAuth)
                    VALUES (@uId, @endpoint, @p256dh, @auth)
                `;
                await request.query(insertQuery);
            }
            return true;
        } catch (error) {
            console.error('Error saving subscription:', error);
            throw error;
        }
    },

    getSubscriptionsByUser: async (uId) => {
        const request = pool.request();
        request.input('uId', sql.Int, uId);
        const result = await request.query('SELECT * FROM subscriptions WHERE uId = @uId');
        return result.recordset;
    },

    // Fetch all valid subscriptions for users who have tasks that need reminders
    // This is a bit complex. Ideally, we find tasks first, then get subs for those users.
    getAllSubscriptions: async () => {
        const request = pool.request();
        const result = await request.query('SELECT * FROM subscriptions');
        return result.recordset;
    },

    deleteSubscription: async (endpoint) => {
        const request = pool.request();
        request.input('endpoint', sql.NVarChar(sql.MAX), endpoint);
        await request.query('DELETE FROM subscriptions WHERE sEndpoint = @endpoint');
    }
};

module.exports = NotificationModel;
