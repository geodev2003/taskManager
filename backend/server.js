const express = require('express');
const dotenv = require('dotenv');
const { sql, pool, poolConnection } = require('./src/config/db');

dotenv.config();

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
});

async function testDBConnection() {
    try {
        await poolConnection;
        console.log('Connected to SQL Server');
    } catch (err) {
        console.error('Error connecting to SQL Server:', err);
    }
}

const PORT = process.env.PORT || 3000;  
app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});