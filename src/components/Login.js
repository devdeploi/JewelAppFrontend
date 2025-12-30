import React, { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import './Login.css';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email && password) {
            // Mock validation
            onLogin();
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="text-center mb-4">
                    <i className="fas fa-crown fa-3x mb-3 text-white"></i>
                    <h3>Super Admin</h3>
                    <p className="text-white-50">Sign in to manage your empire</p>
                </div>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Control
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formBasicPassword">
                        <Form.Control
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100">
                        Login
                    </Button>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
