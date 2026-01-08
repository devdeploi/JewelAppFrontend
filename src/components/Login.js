import React, { useState } from 'react';
import { Form, Button, Card, InputGroup, ProgressBar, Alert, Nav } from 'react-bootstrap';
import OtpInput from 'react-otp-input';
import './Login.css';
import axios from 'axios';
import { APIURL } from '../utils/Function';

const Login = ({ onLogin, onRegisterClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Login Mode: 'password' or 'otp'
    const [loginMode, setLoginMode] = useState('password');

    // Forgot Password State
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);

    const [isLoading, setIsLoading] = useState(false);

    // Merchant Login OTP State
    const [merchantLoginStep, setMerchantLoginStep] = useState(1);
    const [merchantOtp, setMerchantOtp] = useState('');

    const calculateStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength += 20;
        if (/[A-Z]/.test(pass)) strength += 20;
        if (/[a-z]/.test(pass)) strength += 20;
        if (/[0-9]/.test(pass)) strength += 20;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 20;
        return strength;
    };

    const handleNewPasswordChange = (e) => {
        const val = e.target.value;
        setNewPassword(val);
        setPasswordStrength(calculateStrength(val));
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Try User/Admin Login first
            try {
                const { data } = await axios.post(`${APIURL}/users/login`, { email, password });
                localStorage.setItem('user', JSON.stringify(data));
                onLogin(data.role, data);
            } catch (err) {
                // If User login fails, try Merchant Login
                if (err.response && (err.response.status === 401 || err.response.status === 404)) {
                    const { data } = await axios.post(`${APIURL}/merchants/login`, { email, password });

                    if (data.otpSent) {
                        setMerchantLoginStep(2);
                    } else {
                        // Fallback if backend doesn't trigger OTP (should not happen with new logic)
                        localStorage.setItem('user', JSON.stringify(data));
                        onLogin('merchant', data);
                    }
                } else {
                    throw err;
                }
            }
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendLoginOtp = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await axios.post(`${APIURL}/merchants/send-login-otp`, { email });
            setMerchantLoginStep(2); // Move to OTP entry
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || 'Failed to send OTP. Check if email is registered.');
        } finally {
            setIsLoading(false);
        }
    };


    const handleMerchantVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { data } = await axios.post(`${APIURL}/merchants/verify-login-otp`, {
                email,
                otp: merchantOtp
            });
            localStorage.setItem('user', JSON.stringify(data));
            onLogin('merchant', data);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendResetOtp = async (e) => {
        e.preventDefault();
        setResetError('');
        if (resetEmail && resetEmail.includes('@')) {
            setIsLoading(true);
            try {
                await axios.post(`${APIURL}/forgot-password`, { email: resetEmail });
                setResetStep(2);
                setResetError('');
                setResetMessage(`OTP sent to ${resetEmail}`);
                setTimeout(() => setResetMessage(''), 3000);
            } catch (err) {
                setResetError(err.response?.data?.message || 'Error sending OTP');
            } finally {
                setIsLoading(false);
            }
        } else {
            setResetError('Please enter a valid email.');
        }
    };

    const handleVerifyResetOtp = async (e) => {
        e.preventDefault();
        setResetError('');
        try {
            await axios.post(`${APIURL}/verify-otp`, { email: resetEmail, otp });
            setResetStep(3);
            setResetError('');
        } catch (err) {
            setResetError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        }
    };


    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        if (newPassword === confirmNewPassword && passwordStrength >= 60) {
            try {
                await axios.post(`${APIURL}/reset-password`, {
                    email: resetEmail,
                    otp,
                    newPassword
                });

                setResetMessage('Password reset successful! You can now login.');
                setResetError('');
                setTimeout(() => {
                    setIsForgotPassword(false);
                    setResetStep(1);
                    setResetMessage('');
                    setResetEmail('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setOtp('');
                }, 2000);
            } catch (err) {
                setResetError(err.response?.data?.message || 'Error resetting password');
            }
        } else {
            if (newPassword !== confirmNewPassword) setResetError('Passwords do not match.');
            else if (passwordStrength < 60) setResetError('Password is too weak.');
            else setResetError('An error occurred.');
        }
    };

    return (
        <div className="login-container shadow-lg">
            <Card className="login-card">
                <div className="text-center mb-4">
                    <img src="/images/AURUM.png" alt="Logo" className="mb-3" style={{ height: '90px' }} />
                    <h3 className='fw-bold' style={{ color: '#915200' }}>{isForgotPassword ? 'Reset Password' : 'AURUM'}</h3>
                    <p className='fw-bold' style={{ color: '#915200' }}>{isForgotPassword ? '' : 'Sign in to your account'}</p>
                </div>

                {!isForgotPassword && merchantLoginStep === 1 && (
                    <Nav variant="pills" className="justify-content-center mb-4" activeKey={loginMode} onSelect={(k) => { setLoginMode(k); setError(''); }}>
                        <Nav.Item>
                            <Nav.Link eventKey="password" style={{ color: loginMode === 'password' ? '#fff' : '#915200', backgroundColor: loginMode === 'password' ? '#915200' : 'transparent', border: loginMode === 'password' ? 'none' : '1px solid #915200', marginRight: '5px' }}>Password Login</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="otp" style={{ color: loginMode === 'otp' ? '#fff' : '#915200', backgroundColor: loginMode === 'otp' ? '#915200' : 'transparent', border: loginMode === 'otp' ? 'none' : '1px solid #915200' }}>OTP Login</Nav.Link>
                        </Nav.Item>
                    </Nav>
                )}

                {isForgotPassword ? (
                    <>
                        {resetStep === 1 && (
                            <Form onSubmit={handleSendResetOtp}>
                                <div className="text-center mb-4">
                                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: '80px', height: '80px', backgroundColor: '#fff4e6' }}>
                                        <i className="fas fa-envelope-open-text fa-2x" style={{ color: '#915200' }}></i>
                                    </div>
                                    <p className="text-muted small px-3">
                                        Enter your registered email address. We'll send you a One-Time Password (OTP) to reset your account.
                                    </p>
                                </div>
                                <Form.Group className="mb-4">
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter your registered email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        required
                                        className="py-2"
                                        style={{ borderColor: '#915200' }}
                                    />
                                </Form.Group>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mb-3 py-2 fw-bold"
                                    disabled={isLoading}
                                    style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Sending OTP...
                                        </>
                                    ) : (
                                        'Send Verification Code'
                                    )}
                                </Button>
                            </Form>
                        )}

                        {resetStep === 2 && (
                            <Form onSubmit={handleVerifyResetOtp}>
                                <p className="text-center fw-semibold mb-3" style={{ color: '#915200' }}>
                                    Enter the verification code sent to {resetEmail}
                                </p>
                                <div className="d-flex justify-content-center mb-4">
                                    <OtpInput
                                        value={otp}
                                        onChange={setOtp}
                                        numInputs={6}
                                        renderSeparator={<span className="mx-1"></span>}
                                        renderInput={(props) => (
                                            <input
                                                {...props}
                                                style={{
                                                    width: '3rem',
                                                    height: '3rem',
                                                    textAlign: 'center',
                                                    fontSize: '1.2rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #915200',
                                                    background: 'rgba(255, 255, 255, 0.5)',
                                                    color: '#915200',
                                                    outline: 'none'
                                                }}
                                            />
                                        )}
                                    />
                                </div>
                                <Button variant="primary" type="submit" className="w-100 mb-3">
                                    Verify OTP
                                </Button>
                            </Form>
                        )}

                        {resetStep === 3 && (
                            <Form onSubmit={handleResetPassword}>
                                <Form.Group className="mb-2">
                                    <InputGroup>
                                        <Form.Control
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="New Password"
                                            value={newPassword}
                                            onChange={handleNewPasswordChange}
                                            required
                                        />
                                        <InputGroup.Text
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            style={{ cursor: 'pointer', color: "#915200" }}

                                        >
                                            <i className={showNewPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </InputGroup.Text>
                                    </InputGroup>
                                    <ProgressBar
                                        now={passwordStrength}
                                        variant={passwordStrength < 50 ? 'danger' : passwordStrength < 80 ? 'warning' : 'success'}
                                        className="mt-1"
                                        style={{ height: '3px' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <InputGroup>
                                        <Form.Control
                                            type={showConfirmNewPassword ? "text" : "password"}
                                            placeholder="Confirm New Password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            required
                                        />
                                        <InputGroup.Text
                                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                            style={{ cursor: 'pointer', color: '#915200' }}
                                        >
                                            <i className={showConfirmNewPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100 mb-3">
                                    Reset Password
                                </Button>
                            </Form>
                        )}

                        {resetMessage && (
                            <div
                                className="d-flex align-items-center justify-content-center mt-3"
                                style={{
                                    backgroundColor: "#e6fffa",
                                    border: "1px solid #b2f5ea",
                                    borderRadius: "8px",
                                    padding: "12px 16px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                }}
                            >
                                <i
                                    className="fas fa-check-circle me-2"
                                    style={{ color: "#0f766e", fontSize: "1.1rem" }}
                                ></i>
                                <span
                                    style={{
                                        color: "#065f46",
                                        fontWeight: 600,
                                        fontSize: "0.95rem",
                                    }}
                                >
                                    {resetMessage}
                                </span>
                            </div>
                        )}
                        {resetError && <Alert variant="danger" dismissible>{resetError}</Alert>}

                        <div className="text-center mt-3">
                            <span
                                className="pointer"
                                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#915200' }}
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setResetStep(1);
                                    setResetError('');
                                    setResetMessage('');
                                }}
                            >
                                Back to Login
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        {merchantLoginStep === 1 ? (
                            <Form onSubmit={loginMode === 'password' ? handlePasswordLogin : handleSendLoginOtp}>
                                {error && (
                                    <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3 shadow-sm border-0" style={{ fontSize: '0.9rem' }}>
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-exclamation-circle me-2 fs-5"></i>
                                            <span>{error}</span>
                                        </div>
                                    </Alert>
                                )}
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                {loginMode === 'password' && (
                                    <Form.Group className="mb-4" controlId="formBasicPassword">
                                        <InputGroup>
                                            <Form.Control
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <InputGroup.Text
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ cursor: 'pointer', color: '#915200' }}
                                            >
                                                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                            </InputGroup.Text>
                                        </InputGroup>
                                    </Form.Group>
                                )}

                                <Button variant="primary" type="submit" className="w-100 mb-3" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {loginMode === 'password' ? 'Login' : 'Sending OTP...'}
                                        </>
                                    ) : (
                                        loginMode === 'password' ? 'Login' : 'Get OTP'
                                    )}
                                </Button>

                                {loginMode === 'password' && (
                                    <div className="text-center mb-3">
                                        <span
                                            style={{ color: "#915200", cursor: 'pointer' }}
                                            onClick={() => setIsForgotPassword(true)}
                                        >
                                            Forgot Password?
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mt-3">
                                    <span style={{ color: "#915200" }}>New Merchant? </span>
                                    <span
                                        className="fw-bold"
                                        style={{ cursor: 'pointer', textDecoration: 'underline', color: "#915200" }}
                                        onClick={onRegisterClick}
                                    >
                                        Register Here
                                    </span>
                                </div>
                            </Form>
                        ) : (
                            <Form onSubmit={handleMerchantVerifyOtp}>
                                <div className="text-center mb-4">
                                    <p className="text-muted small px-3">
                                        Enter the verification code sent to {email}
                                    </p>
                                </div>
                                {error && (
                                    <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3 shadow-sm border-0" style={{ fontSize: '0.9rem' }}>
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-exclamation-circle me-2 fs-5"></i>
                                            <span>{error}</span>
                                        </div>
                                    </Alert>
                                )}
                                <div className="d-flex justify-content-center mb-4">
                                    <OtpInput
                                        value={merchantOtp}
                                        onChange={setMerchantOtp}
                                        numInputs={6}
                                        renderSeparator={<span className="mx-1"></span>}
                                        renderInput={(props) => (
                                            <input
                                                {...props}
                                                style={{
                                                    width: '3rem',
                                                    height: '3rem',
                                                    textAlign: 'center',
                                                    fontSize: '1.2rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #915200',
                                                    background: 'rgba(255, 255, 255, 0.5)',
                                                    color: '#915200',
                                                    outline: 'none'
                                                }}
                                            />
                                        )}
                                    />
                                </div>
                                <Button variant="primary" type="submit" className="w-100 mb-3" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Verifying OTP...
                                        </>
                                    ) : (
                                        'Verify & Login'
                                    )}
                                </Button>
                                <div className="text-center mt-3">
                                    <span
                                        className="pointer"
                                        style={{ cursor: 'pointer', textDecoration: 'underline', color: '#915200' }}
                                        onClick={() => {
                                            setMerchantLoginStep(1);
                                            setError('');
                                            setMerchantOtp('');
                                        }}
                                    >
                                        Back to Login
                                    </span>
                                </div>
                            </Form>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

export default Login;
