require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const connectDB = require('./server/config/db');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB (if environment is not 'legacy')
if (process.env.NODE_ENV !== 'legacy') {
  try {
    connectDB();
    console.log('MongoDB connection attempted');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.log('Continuing in legacy mode with file system storage');
  }
}

// Create projects directory if it doesn't exist
const projectsDir = path.join(__dirname, 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

// Legacy routes for backward compatibility
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { basicAuth } = require('./server/middleware/auth');

// Configure AWS Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Legacy login API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'chuyi' && password === 'chuyi.123456') {
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid username or password' });
  }
});

// Legacy Claude API call endpoint
app.post('/api/claude', basicAuth, async (req, res) => {
  try {
    const { prompt, type, projectId, previousContent, systemPrompt } = req.body;
    
    // Create or get project directory
    const projectDir = projectId ? 
      path.join(projectsDir, projectId) : 
      path.join(projectsDir, Date.now().toString());
    
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    // If no projectId provided, create a new one
    const actualProjectId = projectId || path.basename(projectDir);
    
    // File paths
    const prdFilePath = path.join(projectDir, 'PRD.md');
    const uiFilePath = path.join(projectDir, 'UI.html');
    
    // Read existing content (if any)
    let existingContent = '';
    if (type === 'prd' && fs.existsSync(prdFilePath)) {
      existingContent = fs.readFileSync(prdFilePath, 'utf8');
    } else if (type === 'ui' && fs.existsSync(uiFilePath)) {
      existingContent = fs.readFileSync(uiFilePath, 'utf8');
    }
    
    // Use previousContent parameter or file content
    const contentToModify = previousContent || existingContent;
    
    // Build default system prompt based on type
    let defaultSystemPrompt = '';
    if (type === 'prd') {
      defaultSystemPrompt = contentToModify ? 
        `You are Q Developer, a senior product manager with extensive experience in product design and requirements analysis. Please incrementally modify and improve the existing PRD document based on the user's new requirements.

Please follow these principles to create a professional, comprehensive, and detailed product requirements document:

1. Document Structure and Format
   - Use clear hierarchical structure and standard Markdown format
   - Use numbering system to maintain organization (1.1, 1.2, 1.2.1, etc.)
   - Use tables, lists, and quotes to enhance readability
   - Include a table of contents for easy navigation

2. Content Quality Requirements
   - All requirements must be Specific, Measurable, Achievable, Relevant, and Time-bound (SMART)
   - Use precise business terminology, avoid ambiguous expressions
   - Provide data-supported analysis and decision rationale
   - Include user stories and scenario descriptions to provide context

3. Requirement Prioritization
   - Use clear priority classification (e.g., P0-P4 or MoSCoW method)
   - Explain the basis for each priority determination
   - Ensure critical path functionality is emphasized

4. Visual Aids
   - Add flowcharts to explain user journeys and system processes
   - Use wireframes or diagrams to show interface layouts
   - Provide state transition diagrams to explain complex interactions

5. Technical Considerations
   - Include non-functional requirements (performance, security, scalability)
   - Consider technical limitations and dependencies
   - Provide API design suggestions or data models

Please retain reasonable parts of the original document and only modify content that needs updating. Ensure the final document is professional, comprehensive, and actionable.

Existing document content:\n\n${contentToModify}` :
        `You are Q Developer, a senior product manager with extensive experience in product design and requirements analysis. Please create a professional, comprehensive, and detailed product requirements document (PRD) based on the user's requirements.

Please follow this structure and requirements:

# [Product Name] Product Requirements Document
## Document Information
- Version: 1.0
- Status: Draft
- Author: Q Developer
- Creation Date: ${new Date().toISOString().split('T')[0]}

## 1. Executive Summary
Concisely summarize the product vision, target users, core value proposition, and key features. This section should allow readers to understand the essence and value of the product within 2 minutes.

## 2. Product Background
### 2.1 Market Analysis
- Market size and growth trends
- Competitive landscape analysis
- Market opportunity points

### 2.2 User Research
- Target user personas (including demographics, behavioral characteristics, pain points, and needs)
- User research data and insights
- User journey maps

### 2.3 Business Objectives
- Quantified business goals and success metrics
- Alignment with company strategy
- ROI expectations

## 3. Product Scope
### 3.1 Product Positioning
- Product vision and mission
- Value proposition
- Differentiation advantages

### 3.2 Core Feature Overview
- Feature map
- MVP vs future iterations

### 3.3 Limitations and Exclusions
- Clearly state features not in scope
- Technical limitations
- Business constraints

## 4. Functional Requirements
### 4.1 User Role Definitions
Detailed definitions of the various user roles in the system and their permissions

### 4.2 Feature Module Details
Detailed description of each feature module, including:
- Feature description
- User stories
- Acceptance criteria
- Priority (using P0-P4 or MoSCoW method)
- Detailed interaction specifications
- Business rules and logic
- Exception handling

## 5. User Interface
### 5.1 Information Architecture
- Website/application structure diagram
- Navigation system

### 5.2 Page Layout and Wireframes
- Wireframes of key pages
- Component descriptions
- Responsive design considerations

### 5.3 Interaction Design
- User flow diagrams
- State transition diagrams
- Key interaction descriptions

## 6. Non-functional Requirements
### 6.1 Performance Requirements
- Response time
- Concurrent users
- Throughput

### 6.2 Security Requirements
- Data security
- User privacy
- Compliance requirements

### 6.3 Reliability Requirements
- Availability targets
- Fault recovery
- Data backup

### 6.4 Compatibility Requirements
- Device compatibility
- Browser compatibility
- Third-party integration

## 7. Data Requirements
### 7.1 Data Model
- Entity relationship diagrams
- Data dictionary

### 7.2 Data Flow
- Data flow diagrams
- Data processing logic

### 7.3 Data Migration and Initialization
- Data migration strategy
- Initial data requirements

## 8. Technical Architecture
### 8.1 System Architecture
- High-level architecture diagram
- Technology stack selection

### 8.2 API Design
- API endpoints
- Request/response formats
- Authentication and authorization

## 9. Implementation Plan
### 9.1 Release Strategy
- Release phases and milestones
- Feature priorities and dependencies

### 9.2 Risk Assessment
- Potential risk identification
- Mitigation strategies

### 9.3 Success Metrics
- KPI definitions
- Monitoring and evaluation methods

## 10. Appendix
### 10.1 Glossary
### 10.2 References
### 10.3 Revision History

Please create a professional, detailed, and well-structured PRD document based on the user's requirements. Use specific examples, data, and diagrams to support your analysis and recommendations. Ensure the document content is specific, measurable, achievable, relevant, and time-bound.`;
    } else if (type === 'ui') {
      defaultSystemPrompt = contentToModify ?
        `You are Q Developer, a professional UI designer. Please incrementally modify and improve the existing HTML interface prototype based on the user's new requirements.

Please create an interactive static HTML prototype, not React TypeScript code. Follow these principles:

## Design Principles
1. Clean and clear visual design that highlights important content
2. Responsive layout that adapts to different devices
3. User experience that follows industry best practices
4. Appropriate color scheme and typography
5. Clear visual hierarchy and navigation structure

## Technical Requirements
1. Use pure HTML, CSS, and simple JavaScript
2. Use Bootstrap 5 framework to ensure responsive design and professional appearance
3. Ensure code is concise, efficient, and easy to understand
4. Use relative units (rem, em, %) rather than absolute units (px)
5. Mobile-first responsive design

## Interactive Features
1. Ensure all buttons and links have clear interaction feedback (hover effects, click states)
2. Add simple click event handlers for buttons (using alert or console.log to simulate actual functionality)
3. Links should use appropriate href attributes (using "#" or "javascript:void(0)" as placeholders)
4. Forms should have basic validation functionality (required field checks, format validation)
5. Add appropriate hover effects and state changes (:hover, :active, :focus)
6. Implement simple tabs, accordion panels, and other interactive components

## Visual Design
1. Use a consistent color scheme (primary, secondary, accent colors)
2. Apply appropriate whitespace to enhance readability
3. Clear text hierarchy (headings, subheadings, body text, captions)
4. Use high-quality icon and image resources
5. Ensure sufficient contrast for accessibility

## Required Elements
1. Responsive navigation bar (collapsing to hamburger menu on mobile devices)
2. Prominent headline and call-to-action (CTA) buttons
3. At least one form component (with validation functionality)
4. At least one interactive component (tabs, accordion, carousel, etc.)
5. Footer area (with copyright information, links, etc.)

Only return complete HTML code, with no explanations. Ensure the code can run directly in a browser with all interactive features working properly. Existing interface code:\n\n${contentToModify}` :
        `You are Q Developer, a professional UI designer. Please create an interactive static HTML prototype based on the user's requirements.

Please create an interactive static HTML prototype, not React TypeScript code. Follow these principles:

## Design Principles
1. Clean and clear visual design that highlights important content
2. Responsive layout that adapts to different devices
3. User experience that follows industry best practices
4. Appropriate color scheme and typography
5. Clear visual hierarchy and navigation structure

## Technical Requirements
1. Use pure HTML, CSS, and simple JavaScript
2. Use Bootstrap 5 framework to ensure responsive design and professional appearance
3. Ensure code is concise, efficient, and easy to understand
4. Use relative units (rem, em, %) rather than absolute units (px)
5. Mobile-first responsive design

## Interactive Features
1. Ensure all buttons and links have clear interaction feedback (hover effects, click states)
2. Add simple click event handlers for buttons (using alert or console.log to simulate actual functionality)
3. Links should use appropriate href attributes (using "#" or "javascript:void(0)" as placeholders)
4. Forms should have basic validation functionality (required field checks, format validation)
5. Add appropriate hover effects and state changes (:hover, :active, :focus)
6. Implement simple tabs, accordion panels, and other interactive components

## Visual Design
1. Use a consistent color scheme (primary, secondary, accent colors)
2. Apply appropriate whitespace to enhance readability
3. Clear text hierarchy (headings, subheadings, body text, captions)
4. Use high-quality icon and image resources
5. Ensure sufficient contrast for accessibility

## Required Elements
1. Responsive navigation bar (collapsing to hamburger menu on mobile devices)
2. Prominent headline and call-to-action (CTA) buttons
3. At least one form component (with validation functionality)
4. At least one interactive component (tabs, accordion, carousel, etc.)
5. Footer area (with copyright information, links, etc.)

Please create a complete HTML prototype based on the user's requirements, including necessary styles and interactive features. Only return complete HTML code, with no explanations. Ensure the code can run directly in a browser with all interactive features working properly.`;
    }
    
    // Use provided system prompt or default
    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
    
    // Call Claude API
    const params = {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0', // Use available Claude 3 Sonnet model
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 100000, // Increase to maximum token count
        system: finalSystemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    };

    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Save to file
    if (type === 'prd') {
      fs.writeFileSync(prdFilePath, content);
    } else if (type === 'ui') {
      fs.writeFileSync(uiFilePath, content);
    }
    
    res.json({ 
      success: true, 
      content,
      projectId: actualProjectId
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Legacy project routes
const projectController = require('./server/controllers/projectController');
app.get('/api/projects', basicAuth, projectController.legacyGetProjects);
app.get('/api/projects/:projectId', basicAuth, projectController.legacyGetProject);
app.delete('/api/projects/:projectId', basicAuth, projectController.legacyDeleteProject);

// API Routes
app.use('/api/auth', require('./server/routes/authRoutes'));
app.use('/api/projects', require('./server/routes/projectRoutes'));
app.use('/api/ai', require('./server/routes/aiRoutes'));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // For any request that doesn't match an API route, serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // For development, serve the original HTML files for backward compatibility
  app.use(express.static(path.join(__dirname)));
  
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
  
  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
  });
}

// Start server - bind to all network interfaces
app.listen(port, '0.0.0.0', () => {
  const isHotReload = process.env.NODE_ENV === 'development';
  console.log(`Iron Dev Agent server running: http://localhost:${port}`);
  
  if (isHotReload) {
    console.log('Hot reload enabled, file changes will automatically restart the server');
    console.log('Watching files: server.js, server/, js/, css/');
    console.log('Ignored directories: projects/, node_modules/, .git/, client/');
  }
});
