import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ProjectView from './components/projects/ProjectView';
import RequirementsStage from './components/stages/RequirementsStage';
import DesignStage from './components/stages/DesignStage';
import DevelopmentStage from './components/stages/DevelopmentStage';
import TestingStage from './components/stages/TestingStage';
import DeploymentStage from './components/stages/DeploymentStage';
import NotFound from './components/common/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectView /></ProtectedRoute>} />
          
          {/* Project stage routes */}
          <Route path="/projects/:projectId/requirements" element={<ProtectedRoute><RequirementsStage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/design" element={<ProtectedRoute><DesignStage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/development" element={<ProtectedRoute><DevelopmentStage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/testing" element={<ProtectedRoute><TestingStage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/deployment" element={<ProtectedRoute><DeploymentStage /></ProtectedRoute>} />
          
          {/* Fallback routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
