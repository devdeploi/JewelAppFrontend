import { Form, Button, Card, Row, Col, InputGroup, ProgressBar } from 'react-bootstrap';
import './Login.css';
import axios from 'axios';
import { APIURL } from '../utils/Function';
import { useRazorpay } from "react-razorpay";
import { useState } from 'react';

const MerchantRegister = ({ onRegister, onSwitchToLogin }) => {
    const { Razorpay } = useRazorpay();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        plan: 'Standard',
    });

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordError, setPasswordError] = useState('');

    const plans = [
        {
            name: 'Standard',
            price: '₹1500/mo',
            features: ['Manage up to 5 chits', 'Basic Analytics', 'Standard Support'],
            color: 'secondary'
        },
        {
            name: 'Premium',
            price: '₹5000/mo',
            features: ['Unlimited Chits', 'Advanced Analytics', 'Priority Support'],
            color: 'secondary' // Gold-ish
        }
    ];

    const calculateStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength += 20;
        if (/[A-Z]/.test(pass)) strength += 20;
        if (/[a-z]/.test(pass)) strength += 20;
        if (/[0-9]/.test(pass)) strength += 20;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 20;
        return strength;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'password') {
            const strength = calculateStrength(value);
            setPasswordStrength(strength);
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleNext = (e) => {
        e.preventDefault();

        if (formData.password !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        if (passwordStrength < 80) { // Require at least 4 criteria met
            setPasswordError("Password is too weak. Ensure it has uppercase, lowercase, numbers, and special chars.");
            return;
        }

        setPasswordError('');
        setStep(step + 1);
    };

    const handleSelectPlan = (planName) => {
        setFormData({ ...formData, plan: planName });
    };

    const handlePaymentAndRegister = async () => {
        const selectedPlan = plans.find(p => p.name === formData.plan);
        if (!selectedPlan) return alert("Please select a plan");

        // Double check email before payment
        try {
            const { data } = await axios.post(`${APIURL}/check-email`, { email: formData.email });
            if (data.exists) {
                alert("Email already registered. canceling payment process. Please login.");
                onSwitchToLogin();
                return;
            }
        } catch (error) {
            console.error(error);
            // inhibit blocking if check fails, or block?
            // Safer to block to avoid money deduction for dup account
            alert("Unable to verify account availability. Please try again.");
            return;
        }

        try {
            // 1. Create Order
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: selectedPlan.price
            });

            // 2. Initialize Razorpay
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_S0aFMLxRqwkL8z", // Replace with your actual Razorpay Key ID
                amount: order.amount,
                currency: order.currency,
                name: "Aurum Jewellery",
                description: `Subscription for ${formData.plan} Plan`,
                order_id: order.id,
                handler: async function (response) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await axios.post(`${APIURL}/payments/verify-subscription-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.status === 'success') {
                            // 4. Register Merchant
                            await registerMerchant(response.razorpay_payment_id);
                        } else {
                            alert("Payment verification failed");
                        }
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed");
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: {
                    color: "#915200"
                }
            };

            const rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Order creation failed');
        }
    };

    const registerMerchant = async (paymentId) => {
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.address,
                plan: formData.plan,
                paymentId: paymentId
            };

            const { data } = await axios.post(`${APIURL}/merchants`, payload);
            alert(`Registration Successful! Welcome ${data.name}.\nPlease wait for Admin approval before logging in.`);
            onSwitchToLogin();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="login-container" style={{ padding: '0 20px', overflow: 'hidden' }}> {/* Prevent body scroll issues */}
            <Card className="login-card" style={{ maxWidth: step === 2 ? '700px' : '700px', padding: '2rem', maxHeight: '100vh', overflowY: 'auto' }}>
                <div className="text-center mb-3">
                    <i className="fas fa-store fa-2x mb-2" style={{ color: '#915200' }}></i>
                    <h3 className="mb-0" style={{ color: '#915200' }}>Merchant Registration</h3>
                    <p className="mb-0" style={{ color: '#915200' }}><small>Step {step} of 2</small></p>
                </div>

                {step === 1 ? (
                    <Form onSubmit={handleNext}>
                        <Row className="mb-2">
                            <Col md={6}>
                                <Form.Group controlId="formName">
                                    <Form.Control name="name" placeholder="Business Name" required onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="formEmail">
                                    <Form.Control name="email" type="email" placeholder="Email Address" required onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-2">
                            <Col md={6}>
                                <Form.Group controlId="formPhone">
                                    <Form.Control name="phone" placeholder="Phone Number" required onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="formAddress">
                                    <Form.Control name="address" placeholder="Business Address" required onChange={handleChange} size="sm" />
                                </Form.Group>
                            </Col>
                        </Row>





                        <h5 className="mb-3 mt-4" style={{ color: '#915200' }}>Security</h5>
                        <Row>
                            <Col>
                                <Form.Group className="mb-2">
                                    <InputGroup size="sm">
                                        <Form.Control
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            required
                                            onChange={handleChange}
                                            value={formData.password}
                                        />
                                        <InputGroup.Text
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ cursor: 'pointer', color: '#915200' }}
                                        >
                                            <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </InputGroup.Text>
                                    </InputGroup>
                                    <ProgressBar
                                        now={passwordStrength}
                                        variant={passwordStrength < 50 ? 'danger' : passwordStrength < 80 ? 'warning' : 'success'}
                                        className="mt-1"
                                        style={{ height: '3px' }}
                                    />
                                    <Form.Text style={{ fontSize: '0.7rem', color: '#915200' }}>
                                        8+ chars, upper, lower, numbers, & symbols.
                                    </Form.Text>
                                </Form.Group>


                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <InputGroup size="sm">
                                        <Form.Control
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            required
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            value={confirmPassword}
                                        />
                                        <InputGroup.Text
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{ cursor: 'pointer', color: '#915200' }}
                                        >
                                            <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </InputGroup.Text>

                                    </InputGroup>

                                    <Form.Text className='fw-bold' style={{ fontSize: '0.7rem', color: '#915200' }}>
                                        Passwords must match.
                                    </Form.Text>
                                    {passwordError && <p className="text-danger mt-1 small mb-0">{passwordError}</p>}
                                </Form.Group>
                            </Col>
                        </Row>

                        <Button variant="primary" type="submit" className="w-100 mb-2" size="sm">
                            Next: Select Plan
                        </Button>
                        <div className="text-center">
                            <span className="small" style={{ color: '#915200' }}>Already have an account? </span>
                            <span className="fw-bold pointer small" style={{ cursor: 'pointer', color: '#915200' }} onClick={onSwitchToLogin}>Login</span>
                        </div>
                    </Form>
                ) : (
                    <div>
                        <h5 className="mb-3 text-center" style={{ color: '#915200' }}>Select Your Subscription</h5>
                        <Row className="g-3">
                            {plans.map((plan) => (
                                <Col md={6} key={plan.name}>
                                    <div
                                        className={`p-3 rounded border ${formData.plan === plan.name ? 'bg-white bg-opacity-25' : 'bg-transparent'}`}
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                            border: '1px solid #915200',
                                            transform: formData.plan === plan.name ? 'scale(1.05)' : 'scale(0.95)',
                                            opacity: formData.plan === plan.name ? 1 : 0.6,
                                            boxShadow: formData.plan === plan.name ? '0 10px 20px rgba(145, 82, 0, 0.2)' : 'none'
                                        }}
                                        onClick={() => handleSelectPlan(plan.name)}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0 fw-bold" style={{ color: '#915200' }}>{plan.name}</h5>
                                            {formData.plan === plan.name && <i className="fas fa-check-circle fa-lg" style={{ color: '#915200' }}></i>}
                                        </div>
                                        <h3 className="mb-2 fw-bold" style={{ color: '#915200' }}>{plan.price}</h3>
                                        <ul className="list-unstyled mb-0 small" style={{ color: '#915200' }}>
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="mb-1 d-flex align-items-center">
                                                    <i className="fas fa-check me-2" style={{ color: '#915200' }}></i>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <div className="mt-4 d-flex gap-3">
                            <Button
                                variant="outline-light"
                                onClick={() => setStep(1)}
                                className="w-50"
                                size="sm"
                                style={{ color: '#915200', borderColor: '#915200' }}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handlePaymentAndRegister}
                                className="w-50 text-white"
                                size="sm"
                                style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                            >
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
