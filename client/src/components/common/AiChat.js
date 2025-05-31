import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';

const AiChat = ({ 
  projectId, 
  stage, 
  type, 
  onContentGenerated, 
  placeholder = "Ask AI to generate content...",
  systemPrompt = null,
  previousContent = null
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Add welcome message on component mount
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `I'm your AI assistant for the ${stage} stage. How can I help you with ${type}?`
      }
    ]);
  }, [stage, type]);
  
  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: input
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Call AI API
      const res = await axios.post('/api/ai/generate', {
        prompt: input,
        type,
        projectId,
        stage,
        previousContent,
        systemPrompt
      });
      
      if (res.data.success) {
        // Add AI response to chat
        const aiMessage = {
          role: 'assistant',
          content: 'Content generated successfully! You can view it in the preview panel.'
        };
        
        setMessages([...messages, userMessage, aiMessage]);
        
        // Call callback with generated content
        if (onContentGenerated) {
          onContentGenerated(res.data.content, res.data.projectId);
        }
      } else {
        // Add error message to chat
        const errorMessage = {
          role: 'assistant',
          content: `Error: ${res.data.error || 'Failed to generate content'}`
        };
        
        setMessages([...messages, userMessage, errorMessage]);
      }
    } catch (err) {
      console.error('Error generating content:', err);
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${err.response?.data?.error || 'Failed to generate content'}`
      };
      
      setMessages([...messages, userMessage, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="h-100 d-flex flex-column">
      <Card.Header>
        <h5 className="mb-0">AI Assistant</h5>
      </Card.Header>
      <Card.Body className="flex-grow-1 overflow-auto">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              {message.content}
            </div>
          ))}
          {loading && (
            <div className="message ai-message">
              <Spinner animation="border" size="sm" className="me-2" />
              Generating content...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card.Body>
      <Card.Footer>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="d-flex">
            <Form.Control
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={loading}
            />
            <Button 
              type="submit" 
              variant="primary" 
              className="ms-2"
              disabled={loading || !input.trim()}
            >
              Send
            </Button>
          </Form.Group>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default AiChat;
