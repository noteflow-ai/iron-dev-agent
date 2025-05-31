import React, { useContext, useState } from 'react';
import { Container, Row, Col, Nav, Navbar, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const MainLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="d-flex flex-column vh-100">
      {/* Top Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" className="px-3">
        <Navbar.Brand as={Link} to="/">
          <strong>Iron Dev Agent</strong>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
              Dashboard
            </Nav.Link>
          </Nav>
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                {user?.firstName || user?.username || 'User'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings">Settings</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="flex-grow-1 d-flex p-0">
        {/* Sidebar */}
        <div className={`sidebar bg-light ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom">
            <h5 className="mb-0">Navigation</h5>
            <Button 
              variant="light" 
              size="sm" 
              onClick={toggleSidebar}
              className="sidebar-toggle"
            >
              {sidebarCollapsed ? '»' : '«'}
            </Button>
          </div>
          <Nav className="flex-column p-3">
            <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
              Projects
            </Nav.Link>
            {/* Conditional project navigation - only show if in a project */}
            {location.pathname.includes('/projects/') && (
              <>
                <div className="sidebar-heading mt-3 mb-2 text-muted">
                  <small>CURRENT PROJECT</small>
                </div>
                <Nav.Link 
                  as={Link} 
                  to={`${location.pathname.split('/').slice(0, 3).join('/')}/requirements`}
                  active={location.pathname.includes('/requirements')}
                >
                  Requirements
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to={`${location.pathname.split('/').slice(0, 3).join('/')}/design`}
                  active={location.pathname.includes('/design')}
                >
                  Design
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to={`${location.pathname.split('/').slice(0, 3).join('/')}/development`}
                  active={location.pathname.includes('/development')}
                >
                  Development
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to={`${location.pathname.split('/').slice(0, 3).join('/')}/testing`}
                  active={location.pathname.includes('/testing')}
                >
                  Testing
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to={`${location.pathname.split('/').slice(0, 3).join('/')}/deployment`}
                  active={location.pathname.includes('/deployment')}
                >
                  Deployment
                </Nav.Link>
              </>
            )}
          </Nav>
        </div>

        {/* Main Content Area */}
        <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
          {children}
        </div>
      </Container>
    </div>
  );
};

export default MainLayout;
