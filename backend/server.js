const express = require('express');
const dotenv = require('dotenv');
const { sql, pool, poolConnection } = require('./src/config/db');

const requestId = require('./src/middlewares/requestId');
const errorHandler = require('./src/middlewares/errorHandler');

const usersRouter = require('./src/routes/users.router');

dotenv.config();

const app = express();

app.use(requestId);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/api/users', usersRouter);

app.use(errorHandler);

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