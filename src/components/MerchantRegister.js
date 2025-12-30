import React, { useState } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import './Login.css';

const MerchantRegister = ({ onRegister, onSwitchToLogin }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        plan: 'Standard'
    });

    const plans = [
        {
            name: 'Standard',
            price: '₹1500/mo',
            features: ['Manage up to 5 chits', 'Basic Analytics', 'Standard Support'],
            color: 'primary'
        },
        {
            name: 'Premium',
            price: '₹5000/mo',
            features: ['Unlimited Chits', 'Advanced Analytics', 'Priority Support'],
            color: 'warning' // Gold-ish
        }
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = (e) => {
        e.preventDefault();
        setStep(step + 1);
    };

    const handleSelectPlan = (planName) => {
        setFormData({ ...formData, plan: planName });
    };

    const handlePaymentAndRegister = () => {
        // Simulation of payment
        alert(`Simulating Payment for ${formData.plan} Plan... Success!`);
        onRegister({ ...formData, role: 'merchant', id: Date.now() });
    };

    return (
        <div className="login-container">
            <Card className="login-card" style={{ maxWidth: step === 2 ? '800px' : '400px' }}>
                <div className="text-center mb-4">
                    <i className="fas fa-store fa-3x mb-3 text-white"></i>
                    <h3>Merchant Registration</h3>
                    <p className="text-white-50">Step {step} of 2</p>
                </div>

                {step === 1 ? (
                    <Form onSubmit={handleNext}>
                        <Form.Group className="mb-3">
                            <Form.Control name="name" placeholder="Business Name" required onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Control name="email" type="email" placeholder="Email Address" required onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Control name="password" type="password" placeholder="Password" required onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Control name="phone" placeholder="Phone Number" required onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Control name="address" placeholder="Business Address" required onChange={handleChange} />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100 mb-3">
                            Next: Select Plan
                        </Button>
                        <div className="text-center">
                            <span className="text-white-50">Already have an account? </span>
                            <span className="text-white fw-bold pointer" style={{ cursor: 'pointer' }} onClick={onSwitchToLogin}>Login</span>
                        </div>
                    </Form>
                ) : (
                    <div>
                        <h5 className="text-white mb-4 text-center">Select Your Subscription</h5>
                        <Row className="g-4">
                            {plans.map((plan) => (
                                <Col md={6} key={plan.name}>
                                    <div
                                        className={`p-4 rounded border ${formData.plan === plan.name ? 'border-success bg-white bg-opacity-10' : 'border-secondary bg-transparent'}`}
                                        style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                                        onClick={() => handleSelectPlan(plan.name)}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h4 className={`text-${plan.color} mb-0`}>{plan.name}</h4>
                                            {formData.plan === plan.name && <i className="fas fa-check-circle text-success fa-2x"></i>}
                                        </div>
                                        <h2 className="text-white mb-3">{plan.price}</h2>
                                        <ul className="list-unstyled text-white-50 mb-0">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="mb-2"><i className="fas fa-check me-2 text-primary"></i>{f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <div className="mt-4 d-flex gap-3">
                            <Button variant="outline-light" onClick={() => setStep(1)} className="w-50">
                                Back
                            </Button>
                            <Button variant="success" onClick={handlePaymentAndRegister} className="w-50">
                                Pay & Register
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MerchantRegister;
