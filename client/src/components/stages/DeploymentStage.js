import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import MainLayout from '../layout/MainLayout';

const DeploymentStage = () => {
  return (
    <MainLayout>
      <Container fluid className="py-4">
        <Alert variant="info">
          <h4>部署阶段</h4>
          <p>此功能即将推出。部署阶段将帮助您配置和管理项目的部署选项。</p>
        </Alert>
      </Container>
    </MainLayout>
  );
};

export default DeploymentStage;
