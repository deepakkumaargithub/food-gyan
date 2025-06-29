const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { driver } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));


const startServer = async () => {
    try {
        await driver.verifyConnectivity();
        console.log('Successfully connected to Neo4j database.');

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to Neo4j database:', error);
        process.exit(1); 
    }
};

startServer();


process.on('SIGINT', async () => {
    console.log('Closing Neo4j driver...');
    await driver.close();
    process.exit(0);
});
