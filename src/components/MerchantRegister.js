/* eslint-disable no-unused-vars */
import { Form, Button, Card, Row, Col, InputGroup, ProgressBar, Spinner, Navbar, Nav, Container } from 'react-bootstrap';
import './Login.css';
import axios from 'axios';
import { APIURL } from '../utils/Function';
import { useRazorpay } from "react-razorpay";
import { useState } from 'react';
import OtpInput from 'react-otp-input';
import { useNavigate } from 'react-router-dom';

// Brand Colors
const brandColor = '#915200';
const goldColor = '#D4AF37';

// Common layout wrapper defined outside to prevent re-renders losing focus
const PageLayout = ({ children, onSwitchToLogin }) => {
    const navigate = useNavigate();

    return (
        <div className="d-flex flex-column min-vh-100" style={{ fontFamily: '"Inter", sans-serif', backgroundColor: '#f9f9f9' }}>
            {/* Navbar */}
            <Navbar expand="lg" className="bg-white shadow-sm py-3" sticky="top">
                <Container>
                    <Navbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
                        <img src="/images/AURUM.png" alt="Logo" height="35" className="me-2" />
                        <span className="fw-bold fs-4" style={{ color: brandColor, letterSpacing: '-0.5px' }}>AURUM</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center">
                            <Nav.Link onClick={() => navigate('/')} className="px-4 ms-lg-3 text-white fw-bold"
                                style={{ backgroundColor: brandColor, borderColor: brandColor, borderRadius: '5px' }}>Home</Nav.Link>
                            {/* <Nav.Link onClick={onSwitchToLogin} className="fw-bold mx-2" style={{ color: brandColor }}>Login</Nav.Link> */}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Main Content Center */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5"
                style={{ backgroundColor: brandColor }}>
                {children}
            </div>

            {/* Footer */}
            <footer className="py-4 text-white" style={{ backgroundColor: '#1a1a1a' }}>
                <Container>
                    <Row className="align-items-center">
                        <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
                            <h5 className="fw-bold mb-1 d-flex align-items-center justify-content-center justify-content-md-start">
                                <img src="/images/AURUM.png" alt="" height="20" className="me-2" style={{ filter: 'brightness(0) invert(1)' }} />
                                AURUM
                            </h5>
                            <p className="small opacity-50 mb-0">Secure. Compliant. Efficient.</p>
                        </Col>
                        <Col md={6} className="text-center text-md-end">
                            <p className="small opacity-50 mb-0">&copy; {new Date().getFullYear()} Aurum. All rights reserved.</p>
                            <p className="small mb-0">Powered by <span className="fw-bold text-white">Safpro Technology Solutions</span></p>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
};

const MerchantRegister = ({ onRegister, onSwitchToLogin }) => {
    const navigate = useNavigate();
    const { Razorpay } = useRazorpay();
    const [step, setStep] = useState(1); // 1: Plan, 2: Details, 3: OTP, 4: Payment/Register
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        plan: '',
        gstin: '',
        addressProof: ''
    });

    const [uploading, setUploading] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordError, setPasswordError] = useState('');

    // OTP States
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const plans = [
        {
            name: 'Standard',
            price: '₹1500/mo',
            features: ['Manage up to 3 chits','Basic Analytics', 'Email Support'],
            color: 'secondary'
        },
        {
            name: 'Premium',
            price: '₹5000/mo',
            features: ['Manage up to 6 chits','Advanced Analytics', 'Priority 24/7 Support'],
            color: 'secondary'
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

    // Step 1: Select Plan
    const handleSelectPlan = (planName) => {
        setFormData({ ...formData, plan: planName });
        setStep(2);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            const { data } = await axios.post(`${APIURL}/upload`, formDataUpload, config);
            setFormData(prev => ({ ...prev, addressProof: data }));
        } catch (error) {
            console.error(error);
            alert('File upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Step 2: Submit Details & Request OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();

        if (!formData.gstin) {
            alert("GSTIN Number is required");
            return;
        }

        if (!formData.addressProof) {
            alert("Address Proof is required");
            return;
        }

        if (formData.password !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        if (passwordStrength < 80) {
            setPasswordError("Password is too weak. Ensure it has uppercase, lowercase, numbers, and special chars.");
            return;
        }

        setPasswordError('');
        setLoading(true);

        try {
            // Check if email exists and send OTP
            await axios.post(`${APIURL}/merchants/send-reg-otp`, { email: formData.email });
            setStep(3);
            setOtpSent(true);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to send verification code");
            if (error.response?.status === 400 && error.response.data.message.includes("already registered")) {
                onSwitchToLogin();
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(`${APIURL}/merchants/verify-reg-otp`, {
                email: formData.email,
                otp
            });
            if (data.success) {
                // Verified. Move to Payment
                setStep(4);
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Payment & Final Registration
    const handlePaymentAndRegister = async () => {
        const selectedPlan = plans.find(p => p.name === formData.plan);
        if (!selectedPlan) return;

        setLoading(true);

        try {
            // 1. Create Order
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: selectedPlan.price
            });

            // 2. Initialize Razorpay
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_S0aFMLxRqwkL8z",
                amount: order.amount,
                currency: order.currency,
                name: "Aurum Jewellery",
                description: `Subscription for ${formData.plan} Plan`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post(`${APIURL}/payments/verify-subscription-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.status === 'success') {
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
                theme: { color: "#915200" }
            };

            const rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Order creation failed');
        } finally {
            setLoading(false);
        }
    };

    const registerMerchant = async (paymentId) => {
        try {
            const payload = {
                ...formData,
                paymentId
            };

            const { data } = await axios.post(`${APIURL}/merchants`, payload);
            setRegistrationSuccess(true);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Registration failed');
        }
    };

    if (registrationSuccess) {
        return (
            <PageLayout onSwitchToLogin={onSwitchToLogin}>
                <Card className="shadowborder-0 p-5 text-center" style={{ maxWidth: '600px', width: '100%', borderRadius: '15px' }}>
                    <div className="mb-4">
                        <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
                            style={{ width: 80, height: 80, backgroundColor: '#e6fffa' }}>
                            <i className="fas fa-check-circle fa-4x" style={{ color: '#0f766e' }}></i>
                        </div>
                        <h2 className="mb-3" style={{ color: '#915200' }}>Registration Submitted!</h2>
                        <p className="text-muted" style={{ fontSize: '1.1rem' }}>
                            Thank you for registering with AURUM. Your application is currently under review.
                        </p>
                        <div className="alert alert-warning mt-4 text-start">
                            <i className="fas fa-info-circle me-2"></i>
                            Please wait for Admin approval. Once approved, you will receive a login URL and credentials in your registered email: <strong>{formData.email}</strong>.
                        </div>
                        <Button variant="outline-dark" className="mt-3" onClick={() => navigate('/')}>Return Home</Button>
                    </div>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout onSwitchToLogin={onSwitchToLogin}>
            <Card className="shadow border-0" style={{ maxWidth: '800px', width: '100%', borderRadius: '15px', overflow: 'hidden' }}>
                <div className="p-4 p-md-5">
                    <div className="text-center mb-4">
                        <h3 className="fw-bold mb-1" style={{ color: '#915200' }}>Merchant Registration</h3>
                        <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className={`rounded-circle d-flex align-items-center justify-content-center fw-bold small ${step === s ? 'bg-warning text-dark' : (step > s ? 'bg-success text-white' : 'bg-light text-muted')}`}
                                    style={{ width: 30, height: 30, transition: 'all 0.3s' }}>
                                    {step > s ? <i className="fas fa-check"></i> : s}
                                </div>
                            ))}
                        </div>
                        <p className="text-muted small mt-2">
                            {step === 1 && "Choose Your Plan"}
                            {step === 2 && "Business Details"}
                            {step === 3 && "Verify Email"}
                            {step === 4 && "Payment & Setup"}
                        </p>
                    </div>

                    {/* Step 1: Plan Selection */}
                    {step === 1 && (
                        <div>
                            <Row className="g-3">
                                {plans.map((plan) => (
                                    <Col md={6} key={plan.name}>
                                        <div
                                            className={`p-4 rounded-3 border text-center h-100 d-flex flex-column justify-content-between position-relative`}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                border: formData.plan === plan.name ? '2px solid #915200' : '1px solid #eee',
                                                backgroundColor: formData.plan === plan.name ? '#fff8e1' : 'white',
                                                boxShadow: formData.plan === plan.name ? '0 10px 20px rgba(145, 82, 0, 0.1)' : 'none'
                                            }}
                                            onClick={() => handleSelectPlan(plan.name)}
                                        >
                                            {formData.plan === plan.name &&
                                                <div className="position-absolute top-0 end-0 p-2 text-warning"><i className="fas fa-check-circle"></i></div>
                                            }
                                            <div>
                                                <h5 className="fw-bold mb-2 text-uppercase letter-spacing-1">{plan.name}</h5>
                                                <h2 className="fw-bold mb-3" style={{ color: '#915200' }}>{plan.price}</h2>
                                                <ul className="list-unstyled small text-start mx-auto opacity-75" style={{ maxWidth: '220px' }}>
                                                    {plan.features.map((f, i) => (
                                                        <li key={i} className="mb-2"><i className="fas fa-check text-success me-2"></i>{f}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <Button
                                                variant={formData.plan === plan.name ? "dark" : "outline-secondary"}
                                                className="mt-3 w-100 rounded-pill"
                                                style={formData.plan === plan.name ? { backgroundColor: '#915200', borderColor: '#915200' } : {}}
                                            >
                                                {formData.plan === plan.name ? 'Selected' : 'Select Plan'}
                                            </Button>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                            {/* <div className="text-center mt-4 pt-2 border-top">
                                <span className="small me-2 text-muted">Already have an account?</span>
                                <span className="fw-bold small pointer text-decoration-underline" style={{ color: '#915200', cursor: 'pointer' }} onClick={onSwitchToLogin}>Login Here</span>
                            </div> */}
                        </div>
                    )}

                    {/* Step 2: Form Details */}
                    {step === 2 && (
                        <Form onSubmit={handleRequestOtp}>
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="formName">
                                        <Form.Label className="small fw-bold text-muted">Business Name</Form.Label>
                                        <Form.Control name="name" placeholder="Enter business name" required onChange={handleChange} value={formData.name} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="formEmail">
                                        <Form.Label className="small fw-bold text-muted">Email Address</Form.Label>
                                        <Form.Control name="email" type="email" placeholder="name@example.com" required onChange={handleChange} value={formData.email} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="formPhone">
                                        <Form.Label className="small fw-bold text-muted">Phone Number</Form.Label>
                                        <Form.Control name="phone" placeholder="10-digit number" required onChange={handleChange} value={formData.phone} maxLength="10" />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="formAddress">
                                        <Form.Label className="small fw-bold text-muted">Business Address</Form.Label>
                                        <Form.Control name="address" placeholder="City, State" required onChange={handleChange} value={formData.address} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="formGSTIN">
                                        <Form.Label className="small fw-bold text-muted">GSTIN Number</Form.Label>
                                        <Form.Control name="gstin" placeholder="Enter GSTIN" required onChange={handleChange} value={formData.gstin} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="formAddressProof">
                                        <Form.Label className="small fw-bold text-muted">GSTIN Address Proof</Form.Label>
                                        <div className="d-flex">
                                            <Form.Control
                                                type="file"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                                accept="image/*"
                                                required={!formData.addressProof}
                                            />
                                            {uploading && <Spinner animation="border" size="sm" className="ms-2 mt-2" />}
                                            {!uploading && formData.addressProof && <i className="fas fa-check text-success ms-2 mt-2"></i>}
                                        </div>
                                        <Form.Text className="text-muted fw-bold">Upload your GSTIN certificate or address proof.</Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="p-3 bg-light rounded mt-4 mb-3">
                                <h6 className="small fw-bold text-uppercase mb-3" style={{ color: '#915200' }}><i className="fas fa-lock me-2"></i>Create Password</h6>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <InputGroup>
                                                <Form.Control
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Password"
                                                    required
                                                    onChange={handleChange}
                                                    value={formData.password}
                                                />
                                                <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                                                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                                </InputGroup.Text>
                                            </InputGroup>
                                            <ProgressBar now={passwordStrength} variant={passwordStrength < 50 ? 'danger' : 'success'} style={{ height: '3px' }} className="mt-1" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <InputGroup>
                                                <Form.Control
                                                    name="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirm Password"
                                                    required
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    value={confirmPassword}
                                                />
                                                <InputGroup.Text onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer' }}>
                                                    <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                                </InputGroup.Text>
                                            </InputGroup>
                                            {passwordError && <p className="text-danger small mb-0 mt-1">{passwordError}</p>}
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            <div className="d-flex gap-3 mt-4">
                                <Button variant="outline-secondary" className="px-4" onClick={() => setStep(1)}>Back</Button>
                                <Button
                                    type="submit"
                                    className="flex-grow-1 text-white fw-bold"
                                    disabled={
                                        loading ||
                                        !formData.name ||
                                        !formData.email ||
                                        !formData.phone ||
                                        !formData.address ||
                                        !formData.gstin ||
                                        !formData.addressProof ||
                                        !formData.password ||
                                        !confirmPassword
                                    }
                                    style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                                >
                                    {loading ? <Spinner size="sm" animation="border" /> : "Continue to Verification"}
                                </Button>
                            </div>
                        </Form>
                    )}

                    {/* Step 3: OTP Verification */}
                    {step === 3 && (
                        <div className="text-center py-4">
                            <div className="mb-4">
                                <div className="mx-auto bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                                    <i className="fas fa-envelope-open-text fa-3x" style={{ color: '#915200' }}></i>
                                </div>
                                <h5>Verify Your Email</h5>
                                <p className="text-muted small">We've sent a 6-digit code to <br /><strong>{formData.email}</strong></p>
                            </div>

                            <form onSubmit={handleVerifyOtp}>
                                <div className="d-flex justify-content-center mb-5">
                                    <OtpInput
                                        value={otp}
                                        onChange={setOtp}
                                        numInputs={6}
                                        renderSeparator={<span className="mx-1"></span>}
                                        renderInput={(props) => (
                                            <input
                                                {...props}
                                                style={{
                                                    width: "45px",
                                                    height: "50px",
                                                    border: "1px solid #ced4da",
                                                    borderRadius: "8px",
                                                    fontSize: "1.5rem",
                                                    textAlign: "center",
                                                    color: "#915200",
                                                    fontWeight: "bold",
                                                    outlineColor: '#915200'
                                                }}
                                            />
                                        )}
                                    />
                                </div>

                                <div className="d-flex gap-3">
                                    <Button variant="outline-secondary" className="px-4" onClick={() => setStep(2)}>Back</Button>
                                    <Button type="submit" className="flex-grow-1 text-white" disabled={loading || otp.length < 6} style={{ backgroundColor: '#915200', borderColor: '#915200' }}>
                                        {loading ? <Spinner size="sm" animation="border" /> : "Verify & Configure"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 4: Payment */}
                    {step === 4 && (
                        <div>
                            <div className="text-center mb-4">
                                <h5 className="mb-1" style={{ color: '#915200' }}>Review & Complete Payment</h5>
                                <p className="text-muted small">Activate your merchant account</p>
                            </div>

                            <div className="p-4 bg-light rounded-4 mb-4 border border-warning border-opacity-25">
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="text-muted">Selected Plan</span>
                                    <span className="fw-bold text-dark">{formData.plan}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="text-muted">Business Name</span>
                                    <span className="fw-bold text-dark">{formData.name}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="text-muted">Email</span>
                                    <span className="fw-bold text-dark">{formData.email}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center pt-2">
                                    <span className="fw-bold" style={{ color: '#915200' }}>Total Amount Payable</span>
                                    <span className="h3 mb-0 fw-bold" style={{ color: '#915200' }}>
                                        {plans.find(p => p.name === formData.plan)?.price}
                                    </span>
                                </div>
                            </div>

                            <div className="d-flex gap-2 mb-4 align-items-start">
                                <Form.Check
                                    type="checkbox"
                                    id="termsCheckbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1"
                                />
                                <small className="text-muted lh-sm mt-2">
                                    I agree to the <a href="/terms" target="_blank" className="fw-bold text-decoration-none" style={{ color: '#915200' }}>Terms of Service</a> and <a href="/privacy" target="_blank" className="fw-bold text-decoration-none" style={{ color: '#915200' }}>Privacy Policy</a>.
                                </small>
                            </div>

                            <div className="alert alert-danger border-danger border-2 d-flex align-items-center mb-4" role="alert">
                                <i className="fas fa-exclamation-circle fa-2x me-3 text-danger"></i>
                                <div>
                                    <h6 className="fw-bold mb-1 text-danger">Mandatory Requirement</h6>
                                    <p className="mb-0 small text-dark">Configuring a valid <strong>Razorpay</strong> account is <strong>MANDATORY</strong> before you can fully register and activate your Merchant account.</p>
                                </div>
                            </div>

                            <Button
                                onClick={handlePaymentAndRegister}
                                disabled={loading || !termsAccepted}
                                size="lg"
                                className="w-100 py-3 text-white fw-bold shadow-sm"
                                style={{ backgroundColor: '#915200', borderColor: '#915200', borderRadius: '50px' }}
                            >
                                {loading ? <Spinner size="sm" animation="border" /> : <span><i className="fas fa-lock me-2"></i>Pay Securely & Register</span>}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </PageLayout >
    );
};

export default MerchantRegister;
