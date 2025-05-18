/**
 * Project Routes
 * 
 * Defines API routes for project submission, listing, and purchasing
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// POST /api/projects - Submit a new project
router.post('/', projectController.submitProject);

// GET /api/projects - Get all projects with optional filters
router.get('/', projectController.getProjects);

// GET /api/projects/:projectId - Get a specific project by ID
router.get('/:projectId', projectController.getProjectById);

// POST /api/projects/:projectId/verify - Verify a project and create tokens
router.post('/:projectId/verify', projectController.verifyProject);

// POST /api/projects/:projectId/purchase - Purchase tokens from a project
router.post('/:projectId/purchase', projectController.purchaseTokens);

module.exports = router;