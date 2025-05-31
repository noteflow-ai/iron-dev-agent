import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <h1 className="display-1">404</h1>
          <h2 className="mb-4">页面未找到</h2>
          <p className="lead mb-5">
            您访问的页面不存在或已被移除。
          </p>
          <Button as={Link} to="/" variant="primary" size="lg">
            返回首页
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
