import React, { useEffect, useState } from 'react';
import { Container, Navbar, Nav, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const brandColor = '#915200';
const accentColor = '#b36800';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const [fadeIn, setFadeIn] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        setFadeIn(true);
    }, []);

    return (
        <div
            className="d-flex flex-column min-vh-100"
            style={{
                fontFamily: '"Inter", sans-serif',
                backgroundColor: '#f9f9f9',
                opacity: fadeIn ? 1 : 0,
                transition: 'opacity 0.6s ease-in-out'
            }}
        >
            {/* Enhanced Navbar */}
            <Navbar expand="lg" className="bg-white shadow-sm py-3" sticky="top">
                <Container>
                    <Navbar.Brand
                        onClick={() => navigate('/')}
                        style={{ cursor: 'pointer' }}
                        className="d-flex align-items-center"
                    >
                        <img
                            src="/images/AURUM.png"
                            alt="Logo"
                            height="40"
                            className="me-2"
                            style={{ transition: 'transform 0.3s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        <span
                            className="fw-bold fs-4"
                            style={{
                                color: brandColor,
                                letterSpacing: '-0.5px',
                                background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}
                        >
                            AURUM
                        </span>
                    </Navbar.Brand>
                    <Nav className="ms-auto align-items-center">
                        <Nav.Link
                            onClick={() => navigate('/')}
                            className="px-4 ms-lg-3 text-white fw-bold position-relative"
                            style={{
                                backgroundColor: brandColor,
                                borderColor: brandColor,
                                borderRadius: '8px',
                                padding: '10px 24px',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                zIndex: 1
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = accentColor;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(145, 82, 0, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = brandColor;
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span style={{ position: 'relative', zIndex: 2 }}>Home</span>
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '0',
                                    height: '0',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    transform: 'translate(-50%, -50%)',
                                    transition: 'width 0.6s, height 0.6s',
                                    zIndex: 1
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.width = '300px';
                                    e.currentTarget.style.height = '300px';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.width = '0';
                                    e.currentTarget.style.height = '0';
                                }}
                            />
                        </Nav.Link>
                    </Nav>
                </Container>
            </Navbar>

            {/* Animated Content */}
            <Container className="flex-grow-1 py-5">
                <Card
                    className="shadow-sm border-0 rounded-4 overflow-hidden"
                    style={{
                        opacity: fadeIn ? 1 : 0,
                        transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.8s ease, transform 0.8s ease',
                        transitionDelay: '0.2s'
                    }}
                >
                    <div className="p-4 p-md-5">
                        <div className="d-flex align-items-center mb-4">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: `rgba(145, 82, 0, 0.1)`,
                                    animation: 'pulse 2s infinite'
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    fill={brandColor}
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                                </svg>
                            </div>
                            <h2 className="fw-bold mb-0" style={{ color: brandColor }}>Privacy Policy</h2>
                        </div>

                        <div
                            className="text-secondary"
                            style={{
                                lineHeight: '1.8',
                                opacity: fadeIn ? 1 : 0,
                                transition: 'opacity 0.8s ease',
                                transitionDelay: '0.4s'
                            }}
                        >
                            <div className="d-flex align-items-center mb-4">
                                <div
                                    style={{
                                        height: '2px',
                                        flexGrow: 1,
                                        background: `linear-gradient(90deg, ${brandColor}, ${accentColor}, transparent)`,
                                        marginRight: '15px'
                                    }}
                                />
                                <p className="mb-0">
                                    <strong>Effective Date:</strong>
                                    <span
                                        className="ms-2 px-3 py-1 rounded-pill"
                                        style={{
                                            backgroundColor: `rgba(145, 82, 0, 0.1)`,
                                            color: brandColor,
                                            fontWeight: '600'
                                        }}
                                    >
                                        January 1, 2026
                                    </span>
                                </p>
                            </div>

                            {[
                                {
                                    title: "1. Information Collection",
                                    content: "We collect information you provide directly to us when registering, such as business name, email, phone number, and address. We also collect transaction data related to your subscription."
                                },
                                {
                                    title: "2. Use of Information",
                                    content: "We use your information to operate and improve our platform, process transactions, send notifications, and prevent fraud."
                                },
                                {
                                    title: "3. Data Sharing",
                                    content: "We do not sell your personal data. We may share information with third-party service providers (e.g., secure payment processors) solely for the purpose of providing our services."
                                },
                                {
                                    title: "4. Data Security",
                                    content: "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is completely secure."
                                },
                                {
                                    title: "5. Your Rights",
                                    content: "You have the right to access, correct, or request deletion of your personal information, subject to legal requirements."
                                }
                            ].map((section, index) => (
                                <div
                                    key={index}
                                    className="mt-4 p-4 rounded-3 position-relative"
                                    style={{
                                        borderLeft: `4px solid ${brandColor}`,
                                        backgroundColor: 'rgba(145, 82, 0, 0.02)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(145, 82, 0, 0.05)';
                                        e.currentTarget.style.transform = 'translateX(5px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(145, 82, 0, 0.02)';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                    }}
                                >
                                    <h5
                                        className="text-dark font-weight-bold mb-3 d-flex align-items-center"
                                        style={{ color: brandColor }}
                                    >
                                        <span
                                            className="rounded-circle d-inline-flex align-items-center justify-content-center me-3"
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                backgroundColor: brandColor,
                                                color: 'white',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {index + 1}
                                        </span>
                                        {section.title}
                                    </h5>
                                    <p className="mb-0" style={{ color: '#555' }}>{section.content}</p>
                                </div>
                            ))}

                            <div
                                className="mt-5 p-4 rounded-3"
                                style={{
                                    background: `linear-gradient(135deg, rgba(145, 82, 0, 0.05), rgba(179, 104, 0, 0.05))`,
                                    border: `1px solid rgba(145, 82, 0, 0.1)`
                                }}
                            >
                                <p className="small text-muted mb-0 d-flex align-items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill={brandColor}
                                        className="me-2"
                                        viewBox="0 0 16 16"
                                    >
                                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                                    </svg>
                                    For privacy-related concerns, please contact
                                    <a
                                        href="mailto:info@safprotech.com"
                                        className="ms-1 fw-bold"
                                        style={{
                                            color: brandColor,
                                            textDecoration: 'none',
                                            transition: 'color 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                                        onMouseLeave={(e) => e.currentTarget.style.color = brandColor}
                                    >
                                        info@safprotech.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </Container>

            {/* Enhanced Footer */}
            <footer
                className="py-4 text-white"
                style={{
                    backgroundColor: '#1a1a1a',
                    opacity: fadeIn ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    transitionDelay: '0.6s'
                }}
            >
                <Container>
                    <Row className="align-items-center">
                        <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
                            <h5
                                className="fw-bold mb-1 d-flex align-items-center justify-content-center justify-content-md-start"
                                style={{ color: '#fff' }}
                            >
                                <img
                                    src="/images/AURUM.png"
                                    alt=""
                                    height="24"
                                    className="me-2"
                                    style={{
                                        filter: 'brightness(0) invert(1)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(15deg) scale(1.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0) scale(1)'}
                                />
                                AURUM
                            </h5>
                            <p className="small opacity-50 mb-0">Secure. Compliant. Efficient.</p>
                        </Col>
                        <Col md={6} className="text-center text-md-end">
                            <p className="small opacity-50 mb-0">
                                &copy; {new Date().getFullYear()} Aurum. All rights reserved.
                            </p>
                            <p className="small mb-0">
                                Powered by
                                <span
                                    className="fw-bold ms-1"
                                    style={{
                                        color: '#fff',
                                        background: `linear-gradient(90deg, #fff, ${brandColor})`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}
                                >
                                    Safpro Technology Solutions
                                </span>
                            </p>
                        </Col>
                    </Row>
                </Container>
            </footer>

            {/* Add CSS animations */}
            <style>
                {`
                    @keyframes pulse {
                        0% { box-shadow: 0 0 0 0 rgba(145, 82, 0, 0.4); }
                        70% { box-shadow: 0 0 0 10px rgba(145, 82, 0, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(145, 82, 0, 0); }
                    }
                    
                    .section-card {
                        transition: all 0.3s ease;
                    }
                    
                    .section-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
                    }
                    
                    ::selection {
                        background-color: rgba(145, 82, 0, 0.3);
                        color: white;
                    }
                    
                    .gradient-border {
                        position: relative;
                    }
                    
                    .gradient-border::before {
                        content: '';
                        position: absolute;
                        top: -2px;
                        left: -2px;
                        right: -2px;
                        bottom: -2px;
                        background: linear-gradient(45deg, ${brandColor}, ${accentColor}, ${brandColor});
                        border-radius: 8px;
                        z-index: -1;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    
                    .gradient-border:hover::before {
                        opacity: 1;
                    }
                `}
            </style>
        </div>
    );
};

export default PrivacyPolicy;