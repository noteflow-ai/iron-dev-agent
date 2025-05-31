import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../layout/MainLayout';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../common/Spinner';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [validated, setValidated] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/projects');
        
        if (res.data.success) {
          setProjects(res.data.projects);
        } else {
          setError('Failed to load projects');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.response?.data?.error || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Handle new project form change
  const handleNewProjectChange = (e) => {
    setNewProject({
      ...newProject,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle new project form submit
  const handleNewProjectSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    try {
      setCreating(true);
      const res = await axios.post('/api/projects', newProject);
      
      if (res.data.success) {
        // Add new project to state
        setProjects([res.data.project, ...projects]);
        
        // Reset form and close modal
        setNewProject({ name: '', description: '' });
        setShowNewProjectModal(false);
        setValidated(false);
        
        // Navigate to new project
        navigate(`/projects/${res.data.project._id}`);
      } else {
        setError('Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };
  
  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'planning':
        return 'info';
      case 'design':
        return 'primary';
      case 'development':
        return 'warning';
      case 'testing':
        return 'secondary';
      case 'deployment':
        return 'success';
      case 'maintenance':
        return 'dark';
      default:
        return 'light';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  return (
    <MainLayout>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1>Projects</h1>
              <Button 
                variant="primary" 
                onClick={() => setShowNewProjectModal(true)}
              >
                New Project
              </Button>
            </div>
          </Col>
        </Row>
        
        {error && (
          <Row className="mb-4">
            <Col>
              <Alert variant="danger">{error}</Alert>
            </Col>
          </Row>
        )}
        
        <Row>
          <Col>
            <Card>
              <Card.Body>
                {projects.length === 0 ? (
                  <div className="text-center py-5">
                    <h4>No projects yet</h4>
                    <p className="text-muted">Create your first project to get started</p>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowNewProjectModal(true)}
                    >
                      Create Project
                    </Button>
                  </div>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(project => (
                        <tr key={project._id}>
                          <td>
                            <Link to={`/projects/${project._id}`} className="text-decoration-none">
                              {project.name}
                            </Link>
                          </td>
                          <td>{project.description?.substring(0, 100)}{project.description?.length > 100 ? '...' : ''}</td>
                          <td>
                            <Badge bg={getStatusVariant(project.status)}>
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </Badge>
                          </td>
                          <td>{formatDate(project.createdAt)}</td>
                          <td>{formatDate(project.updatedAt)}</td>
                          <td>
                            <Link to={`/projects/${project._id}`} className="btn btn-sm btn-outline-primary me-2">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* New Project Modal */}
      <Modal show={showNewProjectModal} onHide={() => setShowNewProjectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={validated} onSubmit={handleNewProjectSubmit}>
            <Form.Group className="mb-3" controlId="projectName">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newProject.name}
                onChange={handleNewProjectChange}
                required
                placeholder="Enter project name"
              />
              <Form.Control.Feedback type="invalid">
                Please enter a project name.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="projectDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newProject.description}
                onChange={handleNewProjectChange}
                placeholder="Enter project description"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2" 
                onClick={() => setShowNewProjectModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </MainLayout>
  );
};

export default Dashboard;
