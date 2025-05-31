const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'design', 'development', 'testing', 'deployment', 'maintenance'],
    default: 'planning'
  },
  currentStage: {
    type: String,
    enum: ['requirements', 'design', 'development', 'testing', 'deployment'],
    default: 'requirements'
  },
  artifacts: {
    requirements: {
      prd: {
        content: String,
        lastUpdated: Date
      },
      userStories: [{
        title: String,
        description: String,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low']
        },
        status: {
          type: String,
          enum: ['todo', 'inProgress', 'done']
        }
      }],
      technicalSpec: {
        content: String,
        lastUpdated: Date
      }
    },
    design: {
      ui: {
        content: String,
        lastUpdated: Date
      },
      database: {
        schema: String,
        lastUpdated: Date
      },
      api: {
        spec: String,
        lastUpdated: Date
      },
      architecture: {
        diagram: String,
        description: String,
        lastUpdated: Date
      }
    },
    development: {
      frontend: {
        code: String,
        framework: String,
        lastUpdated: Date
      },
      backend: {
        code: String,
        framework: String,
        lastUpdated: Date
      },
      database: {
        migrations: String,
        lastUpdated: Date
      }
    },
    testing: {
      unitTests: {
        code: String,
        coverage: Number,
        lastUpdated: Date
      },
      integrationTests: {
        code: String,
        lastUpdated: Date
      },
      uiTests: {
        code: String,
        lastUpdated: Date
      }
    },
    deployment: {
      docker: {
        dockerfile: String,
        compose: String,
        lastUpdated: Date
      },
      cicd: {
        config: String,
        lastUpdated: Date
      },
      monitoring: {
        config: String,
        lastUpdated: Date
      }
    }
  },
  gitRepo: {
    url: String,
    branch: String
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'developer', 'viewer'],
      default: 'developer'
    }
  }],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
