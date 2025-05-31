import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import MainLayout from '../layout/MainLayout';
import AiChat from '../common/AiChat';

const DevelopmentStage = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('frontend');
  const [frontendCode, setFrontendCode] = useState('');
  const [backendCode, setBackendCode] = useState('');
  const [dbMigrations, setDbMigrations] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  
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
          
          if (artifacts?.development) {
            if (artifacts.development.frontend?.code) {
              setFrontendCode(artifacts.development.frontend.code);
            }
            
            if (artifacts.development.backend?.code) {
              setBackendCode(artifacts.development.backend.code);
            }
            
            if (artifacts.development.database?.migrations) {
              setDbMigrations(artifacts.development.database.migrations);
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
  
  // Handle frontend code generation
  const handleFrontendGenerated = async (content) => {
    setFrontendCode(content);
  };
  
  // Handle backend code generation
  const handleBackendGenerated = async (content) => {
    setBackendCode(content);
  };
  
  // Handle DB migrations generation
  const handleDbMigrationsGenerated = async (content) => {
    setDbMigrations(content);
  };
  
  // Handle code change in editor
  const handleCodeChange = (value) => {
    if (activeTab === 'frontend') {
      setFrontendCode(value);
    } else if (activeTab === 'backend') {
      setBackendCode(value);
    } else if (activeTab === 'dbMigrations') {
      setDbMigrations(value);
    }
  };
  
  // Get language for editor based on active tab
  const getEditorLanguage = () => {
    if (activeTab === 'frontend') {
      return language === 'typescript' ? 'typescript' : 'javascript';
    } else if (activeTab === 'backend') {
      return language;
    } else if (activeTab === 'dbMigrations') {
      return 'sql';
    }
    return 'javascript';
  };
  
  // Get code for editor based on active tab
  const getEditorCode = () => {
    if (activeTab === 'frontend') {
      return frontendCode;
    } else if (activeTab === 'backend') {
      return backendCode;
    } else if (activeTab === 'dbMigrations') {
      return dbMigrations;
    }
    return '';
  };
  
  // Save code changes
  const saveCode = async () => {
    try {
      let type = '';
      let content = '';
      
      if (activeTab === 'frontend') {
        type = 'frontend';
        content = frontendCode;
      } else if (activeTab === 'backend') {
        type = 'backend';
        content = backendCode;
      } else if (activeTab === 'dbMigrations') {
        type = 'database';
        content = dbMigrations;
      }
      
      const res = await axios.put(`/api/projects/${projectId}/artifacts/development/${type}`, {
        content
      });
      
      if (!res.data.success) {
        setError('Failed to save code');
      }
    } catch (err) {
      console.error('Error saving code:', err);
      setError(err.response?.data?.error || 'Failed to save code');
    }
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
              <h1>Development - {project.name}</h1>
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
              <Card.Header className="d-flex justify-content-between align-items-center">
                <Nav variant="tabs" className="flex-grow-1">
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'frontend'} 
                      onClick={() => setActiveTab('frontend')}
                    >
                      Frontend
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'backend'} 
                      onClick={() => setActiveTab('backend')}
                    >
                      Backend
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'dbMigrations'} 
                      onClick={() => setActiveTab('dbMigrations')}
                    >
                      DB Migrations
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
                <div className="d-flex">
                  <Form.Select 
                    size="sm" 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="me-2"
                    style={{ width: '120px' }}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                  </Form.Select>
                  <Form.Select 
                    size="sm" 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    style={{ width: '120px' }}
                  >
                    <option value="vs-dark">Dark</option>
                    <option value="vs-light">Light</option>
                  </Form.Select>
                </div>
              </Card.Header>
              <Card.Body className="p-0" style={{ height: '500px' }}>
                <Editor
                  height="100%"
                  language={getEditorLanguage()}
                  value={getEditorCode()}
                  theme={theme}
                  onChange={handleCodeChange}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true
                  }}
                />
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Button 
                  variant="outline-secondary"
                  onClick={() => {
                    // Download code
                    const element = document.createElement('a');
                    let content = getEditorCode();
                    let filename = '';
                    
                    if (activeTab === 'frontend') {
                      filename = `frontend.${language === 'typescript' ? 'ts' : 'js'}`;
                    } else if (activeTab === 'backend') {
                      filename = `backend.${language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'csharp' ? 'cs' : language === 'typescript' ? 'ts' : 'js'}`;
                    } else if (activeTab === 'dbMigrations') {
                      filename = 'migrations.sql';
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
                    variant="success"
                    className="me-2"
                    onClick={saveCode}
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    className="me-2"
                    onClick={() => {
                      // Go back to design stage
                      navigate(`/projects/${projectId}/design`);
                    }}
                  >
                    Previous: Design
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => {
                      // Move to next stage
                      navigate(`/projects/${projectId}/testing`);
                    }}
                  >
                    Next: Testing
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <AiChat 
              projectId={projectId}
              stage="development"
              type={
                activeTab === 'frontend' ? 'frontend' : 
                activeTab === 'backend' ? 'backend' : 
                'database'
              }
              onContentGenerated={
                activeTab === 'frontend' ? handleFrontendGenerated : 
                activeTab === 'backend' ? handleBackendGenerated : 
                handleDbMigrationsGenerated
              }
              previousContent={
                activeTab === 'frontend' ? frontendCode : 
                activeTab === 'backend' ? backendCode : 
                dbMigrations
              }
              placeholder={`Ask AI to generate ${
                activeTab === 'frontend' ? 'frontend code' : 
                activeTab === 'backend' ? 'backend code' : 
                'database migrations'
              }...`}
            />
          </Col>
        </Row>
      </Container>
    </MainLayout>
  );
};

export default DevelopmentStage;
