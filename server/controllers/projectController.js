const Project = require('../models/Project');
const fs = require('fs');
const path = require('path');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { name, description, tags } = req.body;

    const project = await Project.create({
      name,
      description,
      tags: tags || [],
      createdBy: req.user._id,
      collaborators: [{ user: req.user._id, role: 'owner' }]
    });

    // Create project directory
    const projectDir = path.join(__dirname, '../../projects', project._id.toString());
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error in createProject:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    // Find projects where user is a collaborator
    const projects = await Project.find({
      'collaborators.user': req.user._id
    })
    .sort({ updatedAt: -1 })
    .select('-artifacts'); // Exclude artifacts for list view

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Error in getProjects:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('collaborators.user', 'username email');

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Check if user is a collaborator
    const isCollaborator = project.collaborators.some(
      collab => collab.user._id.toString() === req.user._id.toString()
    );

    if (!isCollaborator) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to access this project' 
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error in getProjectById:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    const { name, description, status, currentStage, tags } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Check if user is a collaborator with admin or owner role
    const collaborator = project.collaborators.find(
      collab => collab.user.toString() === req.user._id.toString()
    );

    if (!collaborator || !['owner', 'admin'].includes(collaborator.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this project' 
      });
    }

    // Update project fields
    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (currentStage) project.currentStage = currentStage;
    if (tags) project.tags = tags;

    const updatedProject = await project.save();

    res.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('Error in updateProject:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Check if user is the owner
    const isOwner = project.collaborators.some(
      collab => collab.user.toString() === req.user._id.toString() && collab.role === 'owner'
    );

    if (!isOwner) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the project owner can delete this project' 
      });
    }

    // Delete project directory
    const projectDir = path.join(__dirname, '../../projects', project._id.toString());
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    await project.remove();

    res.json({
      success: true,
      message: `Project ${req.params.id} successfully deleted`
    });
  } catch (error) {
    console.error('Error in deleteProject:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Update project artifact
// @route   PUT /api/projects/:id/artifacts/:stage/:type
// @access  Private
exports.updateArtifact = async (req, res) => {
  try {
    const { id, stage, type } = req.params;
    const { content } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Check if user is a collaborator
    const isCollaborator = project.collaborators.some(
      collab => collab.user.toString() === req.user._id.toString()
    );

    if (!isCollaborator) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this project' 
      });
    }

    // Validate stage and type
    if (!project.artifacts[stage]) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid stage: ${stage}` 
      });
    }

    if (!project.artifacts[stage][type]) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid artifact type: ${type}` 
      });
    }

    // Update the artifact
    if (typeof project.artifacts[stage][type] === 'object') {
      project.artifacts[stage][type].content = content;
      project.artifacts[stage][type].lastUpdated = Date.now();
    } else {
      // Handle array types or other structures
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot update this artifact type directly' 
      });
    }

    // Save to filesystem for backward compatibility
    const projectDir = path.join(__dirname, '../../projects', id);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // Map artifact types to file names
    const fileMap = {
      prd: 'PRD.md',
      ui: 'UI.html'
    };

    if (fileMap[type]) {
      fs.writeFileSync(path.join(projectDir, fileMap[type]), content);
    }

    await project.save();

    res.json({
      success: true,
      message: `${stage}/${type} artifact updated successfully`
    });
  } catch (error) {
    console.error('Error in updateArtifact:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Get project artifact
// @route   GET /api/projects/:id/artifacts/:stage/:type
// @access  Private
exports.getArtifact = async (req, res) => {
  try {
    const { id, stage, type } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Check if user is a collaborator
    const isCollaborator = project.collaborators.some(
      collab => collab.user.toString() === req.user._id.toString()
    );

    if (!isCollaborator) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to access this project' 
      });
    }

    // Validate stage and type
    if (!project.artifacts[stage]) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid stage: ${stage}` 
      });
    }

    if (!project.artifacts[stage][type]) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid artifact type: ${type}` 
      });
    }

    // Get the artifact content
    let content;
    if (typeof project.artifacts[stage][type] === 'object') {
      content = project.artifacts[stage][type].content;
    } else {
      // Handle array types or other structures
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot retrieve this artifact type directly' 
      });
    }

    res.json({
      success: true,
      artifact: {
        content,
        lastUpdated: project.artifacts[stage][type].lastUpdated
      }
    });
  } catch (error) {
    console.error('Error in getArtifact:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Legacy get projects list (for backward compatibility)
// @route   GET /api/projects (with basic auth)
// @access  Public (with basic auth)
exports.legacyGetProjects = async (req, res) => {
  try {
    const projectsDir = path.join(__dirname, '../../projects');
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    const projects = fs.readdirSync(projectsDir)
      .filter(dir => fs.statSync(path.join(projectsDir, dir)).isDirectory())
      .map(dir => {
        const projectPath = path.join(projectsDir, dir);
        const hasPRD = fs.existsSync(path.join(projectPath, 'PRD.md'));
        const hasUI = fs.existsSync(path.join(projectPath, 'UI.html'));
        
        return {
          id: dir,
          hasPRD,
          hasUI,
          createdAt: fs.statSync(projectPath).birthtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Legacy get project content (for backward compatibility)
// @route   GET /api/projects/:projectId (with basic auth)
// @access  Public (with basic auth)
exports.legacyGetProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join(__dirname, '../../projects', projectId);
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const prdPath = path.join(projectPath, 'PRD.md');
    const uiPath = path.join(projectPath, 'UI.html');
    
    const prdContent = fs.existsSync(prdPath) ? fs.readFileSync(prdPath, 'utf8') : '';
    const uiContent = fs.existsSync(uiPath) ? fs.readFileSync(uiPath, 'utf8') : '';
    
    res.json({
      success: true,
      project: {
        id: projectId,
        prd: prdContent,
        ui: uiContent
      }
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Legacy delete project (for backward compatibility)
// @route   DELETE /api/projects/:projectId (with basic auth)
// @access  Public (with basic auth)
exports.legacyDeleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join(__dirname, '../../projects', projectId);
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Recursively delete project directory
    fs.rmSync(projectPath, { recursive: true, force: true });
    
    res.json({ success: true, message: `Project ${projectId} successfully deleted` });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
