const fs = require('fs');
const path = require('path');
const { sql, pool } = require('../config/db');

async function runMigrations() {
    try {
        console.log('Running migrations...');
        await pool.connect();
        console.log('Connected to SQL Server\n');
        const migrationDir = __dirname;

        const files = fs.readdirSync(migrationDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        if (files.length === 0) {
            console.log('No migrations found');
            return;
        }

        for (const file of files) {
            const filePath = path.join(migrationDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            console.log(`Applying migration: ${file}`);
            await pool.request().query(sql);
            console.log(`>>> Applied migration: ${file}\n`);
        }
        console.log('\n=== All migrations applied successfully ===');
        process.exit(0);
    } catch (err) {
        console.error('Error running migrations:', err);
        console.error(err.message);
        process.exit(1);
    }
}

runMigrations();