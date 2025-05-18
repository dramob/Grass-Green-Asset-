/**
 * Green Asset Backend Server
 * 
 * Main entry point for the Express server
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const verificationRoutes = require('./routes/verificationRoutes');
const certificationRoutes = require('./routes/certificationRoutes');
const tokenizationRoutes = require('./routes/tokenizationRoutes');
const projectRoutes = require('./routes/projectRoutes');
const oracleRoutes = require('./routes/oracleRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security and utility middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Home route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Green Asset API',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/verification', verificationRoutes);
app.use('/api/certification', certificationRoutes);
app.use('/api/tokenization', tokenizationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/oracle', oracleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Green Asset backend service running on port ${PORT}`);
  console.log('API endpoints:');
  console.log('- GET  /');
  console.log('- POST /api/verification');
  console.log('- POST /api/certification');
  console.log('- POST /api/tokenization/issue');
  console.log('- POST /api/tokenization/authorize');
  console.log('- POST /api/tokenization/mint');
  console.log('- GET  /api/tokenization/holdings/:address');
  console.log('- POST /api/projects');
  console.log('- GET  /api/projects');
  console.log('- GET  /api/projects/:projectId');
  console.log('- POST /api/projects/:projectId/verify');
  console.log('- POST /api/projects/:projectId/purchase');
  console.log('- GET  /api/oracle/price');
  console.log('- GET  /api/oracle/xrpl');
});

module.exports = app;