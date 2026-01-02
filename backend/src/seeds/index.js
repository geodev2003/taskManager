const seedUsers = require('./seedUsers');
const seedTasks = require('./seedTask');
const { pool } = require('../config/db');

async function runSeed() {
    try {
        await pool.connect();
        console.log('Connected to SQL Server');
        await seedUsers(20);
        await seedTasks();
    } catch (err) {
        console.error('Error seeding users:', err);
    } finally {
        await pool.close();
    }
}

runSeed();