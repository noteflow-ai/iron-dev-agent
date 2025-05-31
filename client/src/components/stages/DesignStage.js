import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import MainLayout from '../layout/MainLayout';
import AiChat from '../common/AiChat';

const DesignStage = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ui');
  const [uiContent, setUiContent] = useState('');
  const [dbSchemaContent, setDbSchemaContent] = useState('');
  const [apiSpecContent, setApiSpecContent] = useState('');
  const [architectureContent, setArchitectureContent] = useState('');
  
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // Fetch project and artifacts on component mount
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        // Fetch project details
        const projectRes = await axios.get(`/api/projects/${projectId}`);
        
        if (projectRes.data.success) {
          setProject(projectRes.data.project);
          
          // Extract artifacts if they exist
          const { artifacts } = projectRes.data.project;
          
          if (artifacts?.design) {
            if (artifacts.design.ui?.content) {
              setUiContent(artifacts.design.ui.content);
            }
            
            if (artifacts.design.database?.schema) {
              setDbSchemaContent(artifacts.design.database.schema);
            }
            
            if (artifacts.design.api?.spec) {
              setApiSpecContent(artifacts.design.api.spec);
            }
            
            if (artifacts.design.architecture?.diagram) {
              setArchitectureContent(artifacts.design.architecture.diagram);
            }
          }
        } else {
          setError('Failed to load project');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(err.response?.data?.error || 'Failed to load project');
        
        // If project not found, redirect to 404
        if (err.response?.status === 404) {
          navigate('/404');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, navigate]);
  
  // Handle UI content generation
  const handleUiGenerated = async (content) => {
    setUiContent(content);
  };
  
  // Handle DB schema content generation
  const handleDbSchemaGenerated = async (content) => {
    setDbSchemaContent(content);
  };
  
  // Handle API spec content generation
  const handleApiSpecGenerated = async (content) => {
    setApiSpecContent(content);
  };
  
  // Handle architecture content generation
  const handleArchitectureGenerated = async (content) => {
    setArchitectureContent(content);
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <Container fluid className="py-4">
          <Alert variant="danger">{error}</Alert>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </Container>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1>Design - {project.name}</h1>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                Back to Project
              </Button>
            </div>
          </Col>
        </Row>
        
        <Row className="h-100">
          <Col md={8} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'ui'} 
                      onClick={() => setActiveTab('ui')}
                    >
                      UI Design
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'dbSchema'} 
                      onClick={() => setActiveTab('dbSchema')}
                    >
                      Database Schema
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'apiSpec'} 
                      onClick={() => setActiveTab('apiSpec')}
                    >
                      API Specification
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'architecture'} 
                      onClick={() => setActiveTab('architecture')}
                    >
                      Architecture
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body className="overflow-auto">
                <Tab.Content>
                  <Tab.Pane active={activeTab === 'ui'}>
                    {uiContent ? (
                      <iframe
                        title="UI Preview"
                        srcDoc={uiContent}
                        style={{ width: '100%', height: '100%', border: 'none', minHeight: '500px' }}
                        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                      />
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">No UI design yet. Use the AI assistant to generate one.</p>
                      </div>
                    )}
                  </Tab.Pane>
                  <Tab.Pane active={activeTab === 'dbSchema'}>
                    {dbSchemaContent ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{dbSchemaContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">No database schema yet. Use the AI assistant to generate one.</p>
                      </div>
                    )}
                  </Tab.Pane>
                  <Tab.Pane active={activeTab === 'apiSpec'}>
                    {apiSpecContent ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{apiSpecContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">No API specification yet. Use the AI assistant to generate one.</p>
                      </div>
                    )}
                  </Tab.Pane>
                  <Tab.Pane active={activeTab === 'architecture'}>
                    {architectureContent ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{architectureContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">No architecture diagram yet. Use the AI assistant to generate one.</p>
                      </div>
                    )}
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Button 
                  variant="outline-secondary"
                  onClick={() => {
                    // Download content based on active tab
                    const element = document.createElement('a');
                    let content = '';
                    let filename = '';
                    
                    if (activeTab === 'ui') {
                      content = uiContent;
                      filename = 'UI.html';
                    } else if (activeTab === 'dbSchema') {
                      content = dbSchemaContent;
                      filename = 'DatabaseSchema.md';
                    } else if (activeTab === 'apiSpec') {
                      content = apiSpecContent;
                      filename = 'APISpec.md';
                    } else if (activeTab === 'architecture') {
                      content = architectureContent;
                      filename = 'Architecture.md';
                    }
                    
                    if (!content) return;
                    
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
                    element.setAttribute('download', filename);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                >
                  Download
                </Button>
                <div>
                  <Button 
                    variant="outline-secondary"
                    className="me-2"
                    onClick={() => {
                      // Go back to requirements stage
                      navigate(`/projects/${projectId}/requirements`);
                    }}
                  >
                    Previous: Requirements
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => {
                      // Move to next stage
                      navigate(`/projects/${projectId}/development`);
                    }}
                  >
                    Next: Development
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <AiChat 
              projectId={projectId}
              stage="design"
              type={
                activeTab === 'ui' ? 'ui' : 
                activeTab === 'dbSchema' ? 'database' : 
                activeTab === 'apiSpec' ? 'api' : 
                'architecture'
              }
              onContentGenerated={
                activeTab === 'ui' ? handleUiGenerated : 
                activeTab === 'dbSchema' ? handleDbSchemaGenerated : 
                activeTab === 'apiSpec' ? handleApiSpecGenerated : 
                handleArchitectureGenerated
              }
              previousContent={
                activeTab === 'ui' ? uiContent : 
                activeTab === 'dbSchema' ? dbSchemaContent : 
                activeTab === 'apiSpec' ? apiSpecContent : 
                architectureContent
              }
              placeholder={`Ask AI to generate a ${
                activeTab === 'ui' ? 'UI design' : 
                activeTab === 'dbSchema' ? 'database schema' : 
                activeTab === 'apiSpec' ? 'API specification' : 
                'architecture diagram'
              }...`}
            />
          </Col>
        </Row>
      </Container>
    </MainLayout>
  );
};

export default DesignStage;
