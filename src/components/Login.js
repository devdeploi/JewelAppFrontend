import React, { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import './Login.css';

const Login = ({ onLogin, onRegisterClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simple logic to distinguish: 
        // Admin: admin@jewel.com
        // Merchant: anything else (simulated usually, or check against mockData)

        if (email === 'admin@jewel.com' && password === 'maaz@eache') {
            onLogin('admin', { name: 'Super Admin', role: 'admin' });
        } else if (email.includes('@')) {
            // Assume merchant login for demo if not admin
            // In real app, check DB.
            onLogin('merchant', {
                name: 'Demo Merchant',
                email: email,
                role: 'merchant',
                id: 1, // mapping to mockData ID 1
                plan: "Premium",
                phone: "123-456-7890",
                address: "123 Market St"
            });
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="text-center mb-4">
                    <i className="fas fa-gem fa-3x mb-3 text-white"></i>
                    <h3>Welcome Back</h3>
                    <p className="text-white-50">Sign in to your account</p>
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

                    <Button variant="primary" type="submit" className="w-100 mb-3">
                        Login
                    </Button>
                    {error && <p className="text-danger text-center">{error}</p>}

                    <div className="text-center mt-3">
                        <span className="text-white-50">New Merchant? </span>
                        <span
                            className="text-white fw-bold"
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={onRegisterClick}
                        >
                            Register Here
                        </span>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
