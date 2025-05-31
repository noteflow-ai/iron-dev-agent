import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [validated, setValidated] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  
  const { register, error, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Update error state when context error changes
  useEffect(() => {
    if (error) {
      setRegisterError(error);
    }
  }, [error]);
  
  const { username, email, password, confirmPassword, firstName, lastName } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Check password match when either password field changes
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      if (e.target.name === 'password') {
        setPasswordMatch(e.target.value === confirmPassword);
      } else {
        setPasswordMatch(password === e.target.value);
      }
    }
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    const form = e.currentTarget;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordMatch(false);
      return;
    }
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    // Clear previous errors
    setRegisterError('');
    
    // Call register from context
    const success = await register({
      username,
      email,
      password,
      firstName,
      lastName
    });
    
    if (success) {
      navigate('/');
    }
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="mb-3">Create an Account</h2>
                <p className="text-muted">Join Iron Dev Agent to streamline your development workflow</p>
              </div>
              
              {registerError && (
                <Alert variant="danger">{registerError}</Alert>
              )}
              
              <Form noValidate validated={validated} onSubmit={onSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="firstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={firstName}
                        onChange={onChange}
                        placeholder="Enter your first name"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="lastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={lastName}
                        onChange={onChange}
                        placeholder="Enter your last name"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={username}
                    onChange={onChange}
                    required
                    placeholder="Choose a username"
                    minLength="3"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please choose a username (min 3 characters).
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    placeholder="Enter your email address"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid email address.
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                    placeholder="Create a password"
                    minLength="6"
                    isInvalid={validated && (!password || password.length < 6 || !passwordMatch)}
                  />
                  <Form.Control.Feedback type="invalid">
                    {!passwordMatch ? 'Passwords do not match.' : 'Please enter a password (min 6 characters).'}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-4" controlId="confirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    required
                    placeholder="Confirm your password"
                    isInvalid={validated && (!passwordMatch || !confirmPassword)}
                  />
                  <Form.Control.Feedback type="invalid">
                    {!passwordMatch ? 'Passwords do not match.' : 'Please confirm your password.'}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <div className="d-grid">
                  <Button variant="primary" type="submit" size="lg">
                    Create Account
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-4">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="text-decoration-none">
                    Sign in
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
