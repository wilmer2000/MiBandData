const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const authenticate = require('./middleware/auth');
const csvLogger = require('./middleware/csvLogger');
const dbValidationService = require('./services/dbValidationService');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Serve uploaded files for downloads if needed
app.use('/downloads', express.static(path.join(__dirname, 'uploads')));

// Routes
const csvRoutes = require('./routes/csvRoutes');

// Use authentication for CSV routes (optional)
app.use('/api/csv', authenticate, csvLogger, csvRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({
        message: 'CSV Processing API',
        currentTime: '2025-04-06 00:21:44',
        endpoints: {
            processCsv: '/api/csv/process',
            importCsv: '/api/csv/import',
            checkStatus: '/api/csv/status/:jobId'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong!',
        timestamp: new Date().toISOString()
    });
});

// Start the server
async function startServer() {
    try {
        // Validate and create database tables before starting the server
        await dbValidationService.validateAndCreateTables();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`⏱️  Current time: 2025-04-07 01:24:18 (UTC)`);
            console.log(`👤 User: wilmer2000`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer().then();