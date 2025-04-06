const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const authenticate = require('./middleware/auth');
const csvLogger = require('./middleware/csvLogger');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Current time: 2025-04-06 00:21:44 (UTC)`);
    console.log(`User: wilmer2000`);
});