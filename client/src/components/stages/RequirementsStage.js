import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import MainLayout from '../layout/MainLayout';
import AiChat from '../common/AiChat';

const RequirementsStage = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prd');
  const [prdContent, setPrdContent] = useState('');
  const [techSpecContent, setTechSpecContent] = useState('');
  const [userStories, setUserStories] = useState([]);
  
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
          
          if (artifacts?.requirements) {
            if (artifacts.requirements.prd?.content) {
              setPrdContent(artifacts.requirements.prd.content);
            }
            
            if (artifacts.requirements.technicalSpec?.content) {
              setTechSpecContent(artifacts.requirements.technicalSpec.content);
            }
            
            if (artifacts.requirements.userStories?.length > 0) {
              setUserStories(artifacts.requirements.userStories);
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
  
  // Handle PRD content generation
  const handlePrdGenerated = async (content, newProjectId) => {
    setPrdContent(content);
    
    // If project ID changed (new project was created), redirect to new project
    if (newProjectId && newProjectId !== projectId) {
      navigate(`/projects/${newProjectId}/requirements`);
    }
  };
  
  // Handle technical spec content generation
  const handleTechSpecGenerated = async (content) => {
    setTechSpecContent(content);
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
              <h1>Requirements - {project.name}</h1>
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
                      active={activeTab === 'prd'} 
                      onClick={() => setActiveTab('prd')}
                    >
                      PRD
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'techSpec'} 
                      onClick={() => setActiveTab('techSpec')}
                    >
                      Technical Spec
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'userStories'} 
                      onClick={() => setActiveTab('userStories')}
                    >
                      User Stories
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body className="overflow-auto">
                <Tab.Content>
                  <Tab.Pane active={activeTab === 'prd'}>
                    {prdContent ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{prdContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">No PRD content yet. Use the AI assistant to generate one.</p>
                      </div>
                    )}
                  </Tab.Pane>
                  <Tab.Pane active={activeTab === 'techSpec'}>
                    {techSpecContent ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{techSpecContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">No technical specification yet. Use the AI assistant to generate one.</p>
                      </div>
                    )}
                  </Tab.Pane>
                  <Tab.Pane active={activeTab === 'userStories'}>
                    {userStories.length > 0 ? (
                      <div className="user-stories">
                        {userStories.map((story, index) => (
                          <Card key={index} className="mb-3">
                            <Card.Header>
                              <h6 className="mb-0">{story.title}</h6>
                            </Card.Header>
                            <Card.Body>
                              <p>{story.description}</p>
                              <div className="d-flex justify-content-between">
                                <span className={`badge bg-${story.priority === 'high' ? 'danger' : story.priority === 'medium' ? 'warning' : 'info'}`}>
                                  {story.priority}
                                </span>
                                <span className={`badge bg-${story.status === 'done' ? 'success' : story.status === 'inProgress' ? 'primary' : 'secondary'}`}>
                                  {story.status}
                                </span>
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">No user stories yet. Use the AI assistant to generate some.</p>
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
                    
                    if (activeTab === 'prd') {
                      content = prdContent;
                      filename = 'PRD.md';
                    } else if (activeTab === 'techSpec') {
                      content = techSpecContent;
                      filename = 'TechnicalSpec.md';
                    } else if (activeTab === 'userStories') {
                      content = JSON.stringify(userStories, null, 2);
                      filename = 'UserStories.json';
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
                <Button 
                  variant="primary"
                  onClick={() => {
                    // Move to next stage
                    navigate(`/projects/${projectId}/design`);
                  }}
                >
                  Next: Design Stage
                </Button>
              </Card.Footer>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <AiChat 
              projectId={projectId}
              stage="requirements"
              type={activeTab === 'prd' ? 'prd' : activeTab === 'techSpec' ? 'technicalSpec' : 'userStories'}
              onContentGenerated={
                activeTab === 'prd' 
                  ? handlePrdGenerated 
                  : activeTab === 'techSpec'
                    ? handleTechSpecGenerated
                    : null
              }
              previousContent={
                activeTab === 'prd' 
                  ? prdContent 
                  : activeTab === 'techSpec'
                    ? techSpecContent
                    : null
              }
              placeholder={`Ask AI to generate a ${activeTab === 'prd' ? 'PRD' : activeTab === 'techSpec' ? 'technical specification' : 'user story'}...`}
            />
          </Col>
        </Row>
      </Container>
    </MainLayout>
  );
};

export default RequirementsStage;
