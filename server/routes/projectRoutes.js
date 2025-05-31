const express = require('express');
const router = express.Router();
const { protect, basicAuth } = require('../middleware/auth');
const { 
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateArtifact,
  getArtifact,
  legacyGetProjects,
  legacyGetProject,
  legacyDeleteProject
} = require('../controllers/projectController');

// New API routes with JWT auth
router.post('/', protect, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.put('/:id/artifacts/:stage/:type', protect, updateArtifact);
router.get('/:id/artifacts/:stage/:type', protect, getArtifact);

// Legacy routes with basic auth for backward compatibility
router.get('/legacy', basicAuth, legacyGetProjects);
router.get('/legacy/:projectId', basicAuth, legacyGetProject);
router.delete('/legacy/:projectId', basicAuth, legacyDeleteProject);

module.exports = router;
