const app = require('./app');
const { poolConnection } = require('./src/config/db');

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
    testDBConnection();
});