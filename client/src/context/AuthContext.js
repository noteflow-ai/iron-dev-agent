import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user profile
        const res = await axios.get('/api/auth/profile');
        
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      } catch (err) {
        console.error('Auth check error:', err);
        // Clear invalid token
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post('/api/auth/register', userData);
      
      if (res.data.success) {
        // Save token and set auth header
        localStorage.setItem('token', res.data.user.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.user.token}`;
        
        // Set user
        setUser(res.data.user);
        return true;
      } else {
        setError(res.data.error || 'Registration failed');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      setError(null);
      const res = await axios.post('/api/auth/login', userData);
      
      if (res.data.success) {
        // Save token and set auth header
        localStorage.setItem('token', res.data.user.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.user.token}`;
        
        // Set user
        setUser(res.data.user);
        return true;
      } else {
        setError(res.data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      return false;
    }
  };

  // Logout user
  const logout = () => {
    // Clear token and auth header
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const res = await axios.put('/api/auth/profile', userData);
      
      if (res.data.success) {
        // Update token if provided
        if (res.data.user.token) {
          localStorage.setItem('token', res.data.user.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.user.token}`;
        }
        
        // Update user
        setUser(res.data.user);
        return true;
      } else {
        setError(res.data.error || 'Profile update failed');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Profile update failed');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
