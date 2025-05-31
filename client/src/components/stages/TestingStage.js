import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import MainLayout from '../layout/MainLayout';

const TestingStage = () => {
  return (
    <MainLayout>
      <Container fluid className="py-4">
        <Alert variant="info">
          <h4>测试阶段</h4>
          <p>此功能即将推出。测试阶段将允许您为项目生成和管理测试。</p>
        </Alert>
      </Container>
    </MainLayout>
  );
};

export default TestingStage;
