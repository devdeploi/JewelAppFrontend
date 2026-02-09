import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Navbar, Nav, Offcanvas, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [showComingSoon, setShowComingSoon] = useState(false);

    const handleClose = () => setShowOffcanvas(false);
    const handleShow = () => setShowOffcanvas(true);

    const handleComingSoonClose = () => setShowComingSoon(false);
    const handleComingSoonShow = () => setShowComingSoon(true);

    // Brand Colors
    const brandColor = '#915200'; // Primary Bronze/Brown
    const goldColor = '#D4AF37';  // Metallic Gold
    const lightGold = '#FFF8E1';  // Light Background
    const darkGradient = `linear-gradient(135deg, ${brandColor} 0%, #5a3200 100%)`;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            handleClose(); // Close menu on selection
        }
    };

    const merchantSteps = [
        { title: "Select Plan", icon: "fas fa-list-ul", desc: "Choose a subscription plan that suits your business scale." },
        { title: "Register Business", icon: "fas fa-store", desc: "Enter your business details and personal information." },
        { title: "Verify & Secure", icon: "fas fa-user-shield", desc: "Verify email via OTP and secure your account." },
        { title: "Pay Subscription", icon: "fas fa-credit-card", desc: "Complete payment via Razorpay to submit application." },
        { title: "Get Approved", icon: "fas fa-check-double", desc: "Admin reviews your profile and approves your account." },
        { title: "Create Chit Plans", icon: "fas fa-coins", desc: "Launch customized gold savings schemes for your customers." },
        { title: "Track & Grow", icon: "fas fa-chart-line", desc: "Monitor active users, payments, and grow your business." },
    ];

    const userSteps = [
        { title: "Install App", icon: "fas fa-mobile-alt", desc: "Download the Jewel app from Play Store or App Store." },
        { title: "Sign Up", icon: "fas fa-user-plus", desc: "Register using your email and verify via OTP." },
        { title: "Find Merchants", icon: "fas fa-search-location", desc: "Browse trusted jewellers and view their active chit plans." },
        { title: "Join Scheme", icon: "fas fa-handshake", desc: "Select a plan, enter amount, and join the chit scheme." },
        { title: "Pay Securely", icon: "fas fa-rupee-sign", desc: "Pay monthly installments via UPI, Cards, or Netbanking." },
    ];

    const plans = [
        {
            name: 'Basic',
            price: billingCycle === 'yearly' ? '₹15,000' : '₹1,500',
            period: billingCycle === 'yearly' ? '/yr + 18% GST' : '/mo + 18% GST',
            features: [
                '3 Chits Only',
                'Normal Dashboard',
                'No Shop Image Uploads',
                'Screen Blocking Ads',
                'Email Support'
            ],
            recommended: false,
            savings: billingCycle === 'yearly' ? 'Save ₹3,000/yr' : ''
        },
        {
            name: 'Standard',
            price: billingCycle === 'yearly' ? '₹25,000' : '₹2,500',
            period: billingCycle === 'yearly' ? '/yr + 18% GST' : '/mo + 18% GST',
            features: [
                'Up to 6 Chits',
                'Advanced Dashboard',
                'Unlimited Shop Images',
                'No Screen Blocking Ads',
                '24/7 Support'
            ],
            recommended: false,
            savings: billingCycle === 'yearly' ? 'Save ₹5,000/yr' : ''
        },
        {
            name: 'Premium',
            price: billingCycle === 'yearly' ? '₹35,000' : '₹3,500',
            period: billingCycle === 'yearly' ? '/yr + 18% GST' : '/mo + 18% GST',
            features: [
                'iOS App Access',
                '9 Chit Plan',
                'Custom Ads',
                'Payment Filter (Date)',
                'Priority Support'
            ],
            recommended: true,
            savings: billingCycle === 'yearly' ? 'Save ₹7,000/yr' : ''
        }
    ];

    return (
        <div style={{ fontFamily: '"DM Sans", sans-serif', backgroundColor: '#fff', overflowX: 'hidden' }}>

            {/* Navigation */}
            <Navbar
                expand="lg"
                fixed="top"
                className={`transition-all ${scrolled ? 'shadow-sm bg-white py-2' : 'bg-transparent py-4'}`}
                style={{ transition: 'all 0.3s ease' }}
            >
                <Container>
                    <Navbar.Brand href="#" className="fw-bold d-flex align-items-center">
                        <img src="/images/AURUM.png" alt="Aurum Logo" height="45" className="me-2" />
                        <span style={{ color: scrolled ? brandColor : '#333', fontSize: '1.5rem', letterSpacing: '1px' }}>AURUM</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-lg`} className="border-0 shadow-none" onClick={handleShow} />
                    <Navbar.Offcanvas
                        id={`offcanvasNavbar-expand-lg`}
                        aria-labelledby={`offcanvasNavbarLabel-expand-lg`}
                        placement="end"
                        show={showOffcanvas}
                        onHide={handleClose}
                    >
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title id={`offcanvasNavbarLabel-expand-lg`} className="fw-bold" style={{ color: brandColor }}>
                                AURUM
                            </Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav className="justify-content-end flex-grow-1 pe-3 align-items-lg-center">
                                {['Home', 'About', 'Merchant Flow', 'User Flow', 'Plans'].map((item) => (
                                    <Nav.Link
                                        key={item}
                                        onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                                        className="fw-bold mx-2"
                                        style={{ color: '#555' }}
                                    >
                                        {item}
                                    </Nav.Link>
                                ))}
                                <Button
                                    className="px-4 ms-lg-3 fw-bold mt-3 mt-lg-0"
                                    style={{ backgroundColor: brandColor, borderColor: brandColor }}
                                    onClick={() => {
                                        // navigate('/register');
                                        handleComingSoonShow();
                                        handleClose();
                                    }}
                                >
                                    Register
                                </Button>
                            </Nav>
                        </Offcanvas.Body>
                    </Navbar.Offcanvas>
                </Container>
            </Navbar>

            {/* Hero Section */}
            <header id="home" className="position-relative d-flex align-items-center py-5 py-lg-0" style={{ minHeight: '100vh', background: lightGold }}>
                <div className="d-none d-lg-block" style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', background: `linear-gradient(135deg, #fff 0%, ${lightGold} 100%)`, clipPath: 'polygon(20% 0%, 100% 0, 100% 100%, 0% 100%)' }}></div>
                <Container className="position-relative" style={{ zIndex: 2 }}>
                    <Row className="align-items-center">
                        <Col lg={6} className="mb-5 mb-lg-0">
                            {/* <Badge bg="warning" text="dark" className="mb-3 px-3 py-2 rounded-pill fw-bold">
                                <i className="fas fa-star me-2"></i> #1 Platform for Jewellers
                            </Badge> */}
                            <div className="d-inline-flex align-items-center justify-content-center mb-3 px-3 py-1 rounded-pill border"
                                style={{
                                    borderColor: `${goldColor}30`,
                                    background: '#fff',
                                    boxShadow: '0 4px 12px rgba(145, 82, 0, 0.08)'
                                }}>
                                <span className="fw-bold small text-uppercase" style={{
                                    color: brandColor,
                                    letterSpacing: '2px'
                                }}>
                                    <i className="fas fa-star me-2"></i>#1 Platform for Jewellers
                                </span>
                            </div>
                            <h1 className="display-4 display-lg-3 fw-bold mb-4 text-dark" style={{ lineHeight: 1.2 }}>
                                Digitalize Your <span style={{ color: brandColor }}>Gold Chit</span> Business
                            </h1>
                            <p className="lead text-muted mb-4 mb-lg-5 small-lg" style={{ maxWidth: '90%' }}>
                                Aurum empowers jewellers to manage chit schemes, track payments, and grow their customer base with a powerful, secure mobile-first platform.
                            </p>
                            <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">
                                <Button
                                    size="lg"
                                    className="fw-bold px-5 rounded-pill shadow hover-scale"
                                    style={{ backgroundColor: brandColor, borderColor: brandColor }}
                                    // onClick={() => navigate('/register')}
                                    onClick={handleComingSoonShow}
                                >
                                    Get Started
                                </Button>
                                <Button
                                    variant="outline-dark"
                                    size="lg"
                                    className="fw-bold px-5 rounded-pill shadow-sm hover-scale"
                                    onClick={() => scrollToSection('merchant-flow')}
                                >
                                    Learn More
                                </Button>
                            </div>
                        </Col>
                        <Col lg={6} className="text-center">
                            {/* Visual Graphic with animated elements */}
                            <div className="position-relative mt-5 mt-lg-0" style={{ minHeight: '350px' }}>
                                {/* Main circular graphic with gradient */}
                                <div className="position-relative d-inline-block">
                                    <div className="rounded-circle shadow-lg d-inline-flex align-items-center justify-content-center position-relative hero-circle"
                                        style={{
                                            background: `linear-gradient(135deg, ${lightGold} 0%, white 100%)`,
                                            animation: 'float 6s ease-in-out infinite',
                                            border: `3px solid ${goldColor}`
                                        }}>
                                        {/* Rotating rings */}
                                        <div className="position-absolute" style={{
                                            width: '100%',
                                            height: '100%',
                                            border: `2px dashed ${brandColor}`,
                                            borderRadius: '50%',
                                            opacity: 0.3,
                                            animation: 'rotate 20s linear infinite'
                                        }}></div>
                                        <div className="position-absolute" style={{
                                            width: '110%',
                                            height: '110%',
                                            border: `1px solid ${goldColor}`,
                                            borderRadius: '50%',
                                            opacity: 0.2,
                                            animation: 'rotate 15s linear infinite reverse'
                                        }}></div>

                                        {/* Center content */}
                                        <div className="text-center position-relative" style={{ zIndex: 2 }}>
                                            <div className="mb-4 position-relative">
                                                <img
                                                    src="/images/AURUM.png"
                                                    alt="Aurum Logo"
                                                    className="img-fluid"
                                                    style={{
                                                        height: '180px',
                                                        animation: 'pulse 3s ease-in-out infinite',
                                                        filter: 'drop-shadow(0 10px 20px rgba(212, 175, 55, 0.3))'
                                                    }}
                                                />
                                                <div className="position-absolute" style={{
                                                    top: '0px',
                                                    right: '10px',
                                                    animation: 'sparkle 2s ease-in-out infinite'
                                                }}>
                                                    <i className="fas fa-star" style={{ color: goldColor, fontSize: '1.5rem' }}></i>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Orbiting mini icons */}
                                        {/* <div className="position-absolute" style={{
                                            width: '40px',
                                            height: '40px',
                                            top: '10%',
                                            left: '80%',
                                            animation: 'orbit 8s linear infinite'
                                        }}>
                                            <div className="bg-white rounded-circle shadow d-flex align-items-center justify-content-center" style={{ width: '100%', height: '100%' }}>
                                                <i className="fas fa-mobile-alt" style={{ color: brandColor }}></i>
                                            </div>
                                        </div> */}
                                    </div>
                                </div>

                                {/* Floating Badges - Responsive Positions */}
                                <Card className="position-absolute border-0 shadow-lg p-2 p-lg-3 rounded-4 floating-badge-1"
                                    style={{
                                        animation: 'float 5s ease-in-out infinite 1s',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                    <div className="d-flex align-items-center">
                                        <div className="rounded-circle bg-success text-white p-2 me-2 me-lg-3 icon-box" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                                            <i className="fas fa-check"></i>
                                        </div>
                                        <div className="text-start">
                                            <small className="text-muted d-block small-text">Verified</small>
                                            <strong style={{ color: brandColor }} className="small-text">Merchants</strong>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="position-absolute border-0 shadow-lg p-2 p-lg-3 rounded-4 floating-badge-2"
                                    style={{
                                        animation: 'float 7s ease-in-out infinite 0.5s',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                    <div className="d-flex align-items-center">
                                        <div className="rounded-circle bg-primary text-white p-2 me-2 me-lg-3 icon-box" style={{ animation: 'pulse 2.5s ease-in-out infinite' }}>
                                            <i className="fas fa-shield-alt"></i>
                                        </div>
                                        <div className="text-start">
                                            <small className="text-muted d-block small-text">100% Secure</small>
                                            <strong style={{ color: brandColor }} className="small-text">Payments</strong>
                                        </div>
                                    </div>
                                </Card>

                                {/* <Card className="position-absolute border-0 shadow-lg p-2 p-lg-3 rounded-4 floating-badge-3"
                                    style={{
                                        animation: 'float 6s ease-in-out infinite 2s',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                    <div className="d-flex align-items-center">
                                        <div className="rounded-circle text-white p-2 me-2 me-lg-3 icon-box" style={{ background: brandColor, animation: 'pulse 3s ease-in-out infinite' }}>
                                            <i className="fas fa-users"></i>
                                        </div>
                                        <div className="text-start">
                                            <strong style={{ color: brandColor }} className="d-block small-text">50+</strong>
                                            <small className="text-muted small-text">Happy Merchants</small>
                                        </div>
                                    </div>
                                </Card> */}
                            </div>
                        </Col>
                    </Row>

                    {/* Add Styles for Responsive Hero */}
                    <style>
                        {`
                        @media (max-width: 991px) {
                            #home {
                                padding-top: 100px !important;
                                padding-bottom: 50px !important;
                                min-height: auto !important;
                                text-align: center;
                            }
                            #home p {
                                margin-left: auto;
                                margin-right: auto;
                            }
                            .hero-circle {
                                width: 300px !important;
                                height: 300px !important;
                            }
                            .floating-badge-1 { top: 0; left: 0; }
                            .floating-badge-2 { bottom: 0; right: 0; }
                            .floating-badge-3 { top: 50%; left: -10px; }
                        }
                        @media (min-width: 992px) {
                            .hero-circle {
                                width: 380px !important;
                                height: 380px !important;
                            }
                            .floating-badge-1 { top: 30px; left: -20px; }
                            .floating-badge-2 { bottom: 30px; right: -20px; }
                            .floating-badge-3 { top: 50%; left: -50px; }
                        }
                        .icon-box {
                            width: 35px;
                            height: 35px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .small-text {
                            font-size: 0.85rem;
                        }
                        `}
                    </style>
                </Container>
            </header>

            {/* About Section */}
            {/* About Section */}
            <section id="about" className="py-5 bg-white position-relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="position-absolute" style={{
                    top: '10%',
                    right: '-5%',
                    width: '300px',
                    height: '300px',
                    background: `radial-gradient(circle, ${lightGold} 0%, transparent 70%)`,
                    opacity: 0.5,
                    animation: 'float 10s ease-in-out infinite'
                }}></div>
                <Container className="py-3 py-lg-5 position-relative">
                    {/* Responsive Section Topic */}
                    <div className="text-center mb-5">
                        <div className="d-inline-flex align-items-center justify-content-center mb-3 px-3 py-1 rounded-pill border"
                            style={{
                                borderColor: `${goldColor}30`,
                                background: '#fff',
                                boxShadow: '0 4px 12px rgba(145, 82, 0, 0.08)'
                            }}>
                            <span className="fw-bold small text-uppercase" style={{
                                color: brandColor,
                                letterSpacing: '2px'
                            }}>
                                <i className="fas fa-info-circle me-2"></i>Our Story
                            </span>
                        </div>
                        <h2 className="display-4 fw-bold mb-3" style={{ color: '#1a1a1a' }}>
                            About <span className="position-relative px-2" style={{ color: brandColor }}>
                                Us
                                <svg className="position-absolute start-0 w-100" style={{ bottom: '5px', height: '8px', zIndex: -1 }} viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke={goldColor} strokeWidth="3" fill="none" opacity="0.4" />
                                </svg>
                            </span>
                        </h2>
                    </div>

                    <Row className="align-items-center">
                        <Col lg={5} className="mb-4 mb-lg-0">
                            <div className="position-relative p-5 rounded-4 shadow-lg overflow-hidden" style={{ background: darkGradient, color: 'white' }}>
                                {/* Animated shine effect */}
                                <div className="position-absolute" style={{
                                    top: 0,
                                    left: '-100%',
                                    width: '50%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                    animation: 'shine 3s infinite'
                                }}></div>

                                <i className="fas fa-quote-left fa-3x opacity-25 mb-3"></i>
                                <h2 className="fw-bold mb-4">Empowering Traditional Jewellers for the Digital Age</h2>
                                <p className="opacity-75 mb-4">
                                    Aurum isn't just an app; it's a complete ecosystem designed to bridge the gap between traditional jewellery saving schemes and modern digital payments.
                                </p>

                                {/* Stats row */}
                                <Row className="g-3 mt-4">
                                    <Col xs={4} className="text-center">
                                        <h3 className="fw-bold mb-0" style={{ color: goldColor }}>500+</h3>
                                        <small className="opacity-75">Merchants</small>
                                    </Col>
                                    <Col xs={4} className="text-center border-start border-end border-white border-opacity-25">
                                        <h3 className="fw-bold mb-0" style={{ color: goldColor }}>10K+</h3>
                                        <small className="opacity-75">Users</small>
                                    </Col>
                                    <Col xs={4} className="text-center">
                                        <h3 className="fw-bold mb-0" style={{ color: goldColor }}>₹5Cr+</h3>
                                        <small className="opacity-75">Transacted</small>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                        <Col lg={7} className="ps-lg-5">
                            <Row className="g-4">
                                {[
                                    { icon: 'fas fa-store', title: 'For Merchants', desc: 'Automate your chit management, reduce paperwork, and receive payments instantly directly to your bank account.', color: brandColor },
                                    { icon: 'fas fa-user-check', title: 'For Users', desc: 'Track your gold savings in real-time, pay installments from home, and redeem at your favorite store.', color: '#0066cc' },
                                    { icon: 'fas fa-shield-alt', title: 'Security First', desc: 'Bank-grade security with OTP verification and Razorpay trusted payment gateway integration.', color: '#28a745' },
                                    { icon: 'fas fa-chart-line', title: 'Real-Time Rates', desc: 'Stay updated with live gold and silver rates to make informed decisions for your business.', color: goldColor }
                                ].map((item, idx) => (
                                    <Col md={6} key={idx}>
                                        <Card className="h-100 border-0 shadow-sm hover-card p-4" style={{ transition: 'all 0.3s' }}>
                                            <div className="d-flex align-items-start">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                                                        animation: `pulse 3s ease-in-out infinite ${idx * 0.5}s`
                                                    }}>
                                                    <i className={`${item.icon} text-white`}></i>
                                                </div>
                                                <div>
                                                    <h5 className="fw-bold mb-2" style={{ color: item.color }}>{item.title}</h5>
                                                    <p className="text-muted small mb-0">{item.desc}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </section>


            <section id="merchant-flow" className="py-3 position-relative overflow-hidden"
                style={{
                    background: `linear-gradient(180deg, #fff 0%, ${lightGold}15 100%)`
                }}>

                {/* Abstract Background */}
                <div className="position-absolute top-0 end-0 w-50 h-50 rounded-circle"
                    style={{
                        background: `radial-gradient(circle, ${brandColor}05 0%, transparent 70%)`,
                        filter: 'blur(60px)',
                        transform: 'translate(30%, -30%)'
                    }}></div>
                <div className="position-absolute bottom-0 start-0 w-50 h-50 rounded-circle"
                    style={{
                        background: `radial-gradient(circle, ${goldColor}05 0%, transparent 70%)`,
                        filter: 'blur(60px)',
                        transform: 'translate(-30%, 30%)'
                    }}></div>

                <Container className="py-5 position-relative" style={{ zIndex: 2 }}>

                    {/* Header */}
                    <div className="text-center mb-5 pb-lg-4">
                        <div className="d-inline-flex align-items-center justify-content-center mb-3 px-3 py-1 rounded-pill border"
                            style={{
                                borderColor: `${goldColor}30`,
                                background: '#fff',
                                boxShadow: '0 4px 12px rgba(145, 82, 0, 0.08)'
                            }}>
                            <span className="fw-bold small text-uppercase" style={{
                                color: brandColor,
                                letterSpacing: '2px'
                            }}>
                                <i className="fas fa-gem me-2"></i>Merchant Journey
                            </span>
                        </div>
                        <h2 className="display-4 fw-bold mb-3" style={{ color: '#1a1a1a' }}>
                            Partner with <span className="position-relative px-2" style={{ color: brandColor }}>
                                Aurum
                                <svg className="position-absolute start-0 w-100" style={{ bottom: '5px', height: '8px', zIndex: -1 }} viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke={goldColor} strokeWidth="3" fill="none" opacity="0.4" />
                                </svg>
                            </span>
                        </h2>
                        <p className="lead text-secondary mx-auto" style={{ maxWidth: '650px' }}>
                            A seamless, secure, and profitable ecosystem for modern jewellers.
                        </p>
                    </div>

                    {/* Horizontal Timeline with Cards */}
                    <div className="position-relative">
                        {/* Connection Line */}
                        <div className="position-absolute top-50 start-0 end-0 translate-middle-y d-none d-lg-block"
                            style={{
                                height: '2px',
                                background: `linear-gradient(90deg, transparent, ${brandColor}15 20%, ${goldColor}15 80%, transparent)`,
                                zIndex: 1
                            }}>
                            <div className="position-absolute top-0 start-0 w-25 h-100"
                                style={{
                                    background: `linear-gradient(90deg, transparent, ${goldColor}60, transparent)`,
                                    animation: 'flowLine 6s ease-in-out infinite'
                                }}></div>
                        </div>

                        {/* Steps Container */}
                        <Row className="g-4 justify-content-center">
                            {merchantSteps.map((step, index) => (
                                <Col lg={3} md={6} key={index} className="d-flex justify-content-center">
                                    <div className="position-relative d-flex flex-column align-items-center">
                                        {/* Connection Arrows (Desktop) */}
                                        {/* {index < merchantSteps.length - 1 && (
                                            <div className="d-none d-lg-block position-absolute top-50 end-0 translate-middle-y"
                                                style={{
                                                    width: '50px',
                                                    height: '2px',
                                                    background: `linear-gradient(90deg, ${brandColor}20, ${goldColor}20)`,
                                                    zIndex: 1
                                                }}>
                                                <div className="position-absolute top-50 end-0 translate-middle-y"
                                                    style={{
                                                        width: '0',
                                                        height: '0',
                                                        borderTop: '5px solid transparent',
                                                        borderBottom: '5px solid transparent',
                                                        borderLeft: `8px solid ${goldColor}40`
                                                    }}></div>
                                            </div>
                                        )} */}

                                        {/* Step Number Circle */}
                                        <div className="position-relative mb-4">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center position-relative z-2"
                                                style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    background: `linear-gradient(135deg, ${brandColor}15, ${goldColor}15)`,
                                                    border: `2px solid ${goldColor}30`,
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer'
                                                }}>
                                                <div className="rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        background: `linear-gradient(135deg, ${brandColor}, ${goldColor})`,
                                                        color: '#fff',
                                                        fontSize: '1.2rem',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.3s ease'
                                                    }}>
                                                    {index + 1}
                                                </div>
                                            </div>

                                            {/* Hover Ring Effect */}
                                            <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle"
                                                style={{
                                                    border: `2px solid ${brandColor}20`,
                                                    transform: 'scale(1.1)',
                                                    opacity: 0,
                                                    transition: 'all 0.3s ease'
                                                }}></div>
                                        </div>

                                        {/* Step Card */}
                                        <div className="step-card-horizontal bg-white rounded-4 p-4 position-relative text-center shadow-sm border"
                                            style={{
                                                borderColor: `${goldColor}15 !important`,
                                                maxWidth: '300px',
                                                minHeight: '220px',
                                                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                            }}>
                                            {/* Icon */}
                                            <div className="mb-3"
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    background: `linear-gradient(135deg, ${brandColor}10, ${goldColor}10)`,
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    margin: '0 auto'
                                                }}>
                                                <i className={`${step.icon} fs-5`}
                                                    style={{
                                                        color: brandColor,
                                                        transition: 'all 0.3s ease'
                                                    }}></i>
                                            </div>

                                            {/* Title */}
                                            <h5 className="fw-bold mb-3" style={{
                                                color: '#2c2c2c',
                                                fontSize: '1.1rem'
                                            }}>
                                                {step.title}
                                            </h5>

                                            {/* Description */}
                                            <p className="text-secondary mb-0 small lh-lg" style={{ fontSize: '0.9rem' }}>
                                                {step.desc}
                                            </p>

                                            {/* Bottom Accent */}
                                            <div className="position-absolute bottom-0 start-50 translate-middle-x w-25 h-1 rounded-pill"
                                                style={{
                                                    background: `linear-gradient(90deg, ${brandColor}, ${goldColor})`,
                                                    opacity: 0.3,
                                                    transition: 'all 0.3s ease'
                                                }}></div>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        {/* Mobile Progress Bar */}
                        <div className="d-lg-none mt-5">
                            <div className="progress" style={{ height: '4px', background: `${brandColor}10` }}>
                                <div className="progress-bar"
                                    style={{
                                        width: '100%',
                                        background: `linear-gradient(90deg, ${brandColor}, ${goldColor})`,
                                        animation: 'progressMove 2s ease-in-out infinite alternate'
                                    }}></div>
                            </div>
                            <div className="d-flex justify-content-between mt-2">
                                {merchantSteps.map((step, index) => (
                                    <span key={index} className="small text-muted">{index + 1}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="text-center mt-5 pt-4">
                        <Button
                            className="rounded-pill px-5 py-3 fw-bold border-0 shadow-lg position-relative overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${brandColor} 0%, ${goldColor} 100%)`,
                                transition: 'all 0.3s ease'
                            }}
                            // onClick={() => navigate('/register')}
                            onClick={handleComingSoonShow}
                        >
                            <span className="position-relative z-1 d-flex align-items-center">
                                Start Your Application <i className="fas fa-arrow-right ms-2"></i>
                            </span>
                            <div className="position-absolute top-0 left-0 w-100 h-100"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    transform: 'translateX(-100%)',
                                    transition: 'transform 0.6s ease'
                                }}></div>
                        </Button>
                        <p className="mt-3 text-muted small">
                            <i className="fas fa-lock me-1"></i> Secure • Fast • Reliable
                        </p>
                    </div>

                </Container>

                <style>
                    {`
        .step-card-horizontal:hover {
            transform: translateY(-8px);
            border-color: ${goldColor}30 !important;
            box-shadow: 0 15px 40px -15px rgba(145, 82, 0, 0.15) !important;
        }
        
        .step-card-horizontal:hover .bottom-0 {
            width: 60px !important;
            opacity: 0.8 !important;
        }
        
        .step-card-horizontal:hover .fs-5 {
            transform: scale(1.1);
        }
        
        .position-relative:hover .rounded-circle:first-child {
            border-color: ${goldColor}50 !important;
        }
        
        .position-relative:hover .position-absolute.rounded-circle {
            opacity: 1 !important;
        }
        
        @keyframes flowLine {
            0% { left: -25%; }
            100% { left: 100%; }
        }
        
        @keyframes progressMove {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
        
        Button:hover .position-absolute {
            transform: translateX(100%);
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .step-card-horizontal {
                min-height: 200px;
            }
        }
        `}
                </style>
            </section>

            {/* User Flow Section */}
            <section id="user-flow" className="py-5 text-white position-relative overflow-hidden" style={{ background: darkGradient }}>
                {/* Animated background patterns */}
                <div className="position-absolute" style={{
                    top: '10%',
                    left: '5%',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    animation: 'float 8s ease-in-out infinite'
                }}></div>
                <div className="position-absolute" style={{
                    bottom: '20%',
                    right: '10%',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    animation: 'float 10s ease-in-out infinite 2s'
                }}></div>

                <Container className="py-5 position-relative" style={{ zIndex: 1 }}>
                    <div className="text-center mb-5">
                        <div className="d-inline-flex align-items-center justify-content-center mb-3 px-3 py-1 rounded-pill border"
                            style={{
                                borderColor: `${goldColor}30`,
                                background: '#fff',
                                boxShadow: '0 4px 12px rgba(145, 82, 0, 0.08)'
                            }}>
                            <span className="fw-bold small text-uppercase" style={{
                                color: brandColor,
                                letterSpacing: '2px'
                            }}>
                                <i className="fas fa-users me-2"></i>User Journey
                            </span>
                        </div>
                        <h2 className="fw-bold display-5 mb-3">How Users Join & Payment Flow</h2>
                        <p className="opacity-75 lead">Seamless experience from app to payment</p>
                    </div>

                    <Row className="g-4 align-items-center">
                        <Col lg={6} className="order-2 order-lg-1">
                            <div className="d-flex flex-column gap-3">
                                {userSteps.map((step, index) => (
                                    <div key={index}
                                        className="d-flex align-items-center bg-white bg-opacity-10 p-4 rounded-4 border border-white border-opacity-25 position-relative overflow-hidden"
                                        style={{
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.3s',
                                            animation: `slideInLeft 0.6s ease-out ${index * 0.1}s both`,
                                            cursor: 'pointer'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateX(10px)';
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateX(0)';
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                        }}
                                    >
                                        {/* Shine effect */}
                                        <div className="position-absolute" style={{
                                            top: 0,
                                            left: '-100%',
                                            width: '50%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                                            animation: `shine 3s infinite ${index * 0.5}s`
                                        }}></div>

                                        <div className="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center flex-shrink-0 me-3 shadow-lg position-relative"
                                            style={{
                                                width: 60,
                                                height: 60,
                                                background: `linear-gradient(135deg, white, ${lightGold})`
                                            }}>
                                            <i className={`${step.icon} fa-lg`} style={{ color: brandColor }}></i>
                                            <div className="position-absolute bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                                style={{ width: '24px', height: '24px', bottom: -5, right: -5, fontSize: '0.75rem' }}>
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-1">{step.title}</h6>
                                            <p className="small mb-0 opacity-75">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Col>

                        <Col lg={6} className="order-1 order-lg-2">
                            <div className="position-relative">
                                {/* Mobile mockups with better animation */}
                                <Row className="g-4 justify-content-center">
                                    {[
                                        { icon: 'fa-mobile-alt', title: 'Download', color: '#4CAF50', delay: 0 },
                                        { icon: 'fa-user-circle', title: 'Register', color: '#2196F3', delay: 0.2 },
                                        { icon: 'fa-credit-card', title: 'Pay', color: goldColor, delay: 0.4 }
                                    ].map((item, index) => (
                                        <Col key={index} xs={4}>
                                            <div
                                                className="app-mockup shadow-lg rounded-4 overflow-hidden mx-auto"
                                                style={{
                                                    maxWidth: '180px',
                                                    transform: `translateY(${index * 30}px)`,
                                                    border: '6px solid rgba(255,255,255,0.2)',
                                                    background: 'white',
                                                    animation: `floatMockup 4s ease-in-out infinite ${item.delay}s`
                                                }}>
                                                <div className="bg-dark text-white text-center py-1" style={{ fontSize: '0.7rem' }}>
                                                    <i className="fas fa-circle me-1" style={{ fontSize: '0.4rem' }}></i>
                                                    <i className="fas fa-circle me-1" style={{ fontSize: '0.4rem' }}></i>
                                                </div>
                                                <div style={{ height: '280px', background: `linear-gradient(135deg, ${item.color}22, white)` }}
                                                    className="d-flex flex-column align-items-center justify-content-center p-3">
                                                    <div className="rounded-circle mb-3 d-flex align-items-center justify-content-center"
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            background: item.color,
                                                            animation: 'pulse 2s ease-in-out infinite'
                                                        }}>
                                                        <i className={`fas ${item.icon} fa-2x text-white`}></i>
                                                    </div>
                                                    <h6 className="fw-bold text-center mb-2" style={{ color: item.color }}>{item.title}</h6>
                                                    <div className="w-75 bg-secondary bg-opacity-25 rounded mb-2" style={{ height: '8px' }}></div>
                                                    <div className="w-50 bg-secondary bg-opacity-25 rounded" style={{ height: '8px' }}></div>
                                                </div>
                                                <div className="bg-dark p-2"></div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                {/* Connection lines between phones */}
                                {/* <svg className="position-absolute d-none d-md-block" style={{ top: '50%', left: '10%', width: '80%', height: '2px', zIndex: 0 }}>
                                    <line x1="0" y1="1" x2="100%" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5">
                                        <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1s" repeatCount="indefinite" />
                                    </line>
                                </svg> */}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Plans Section */}
            <section id="plans" className="py-5 position-relative" style={{ background: `linear-gradient(to bottom, #fff 0%, ${lightGold}30 100%)` }}>
                <Container className="py-5">
                    <div className="text-center mb-5">
                        <div className="d-inline-flex align-items-center justify-content-center mb-3 px-3 py-1 rounded-pill border"
                            style={{
                                borderColor: `${goldColor}30`,
                                background: '#fff',
                                boxShadow: '0 4px 12px rgba(145, 82, 0, 0.08)'
                            }}>
                            <span className="fw-bold small text-uppercase" style={{
                                color: brandColor,
                                letterSpacing: '2px'
                            }}>
                                <i className="fas fa-star me-2"></i>Flexible Pricing
                            </span>
                        </div>
                        <h2 className="fw-bold display-5 mb-3 text-dark">Choose the plan that fits you</h2>
                        <p className="text-muted lead mx-auto mb-4" style={{ maxWidth: '600px' }}>
                            Simple, transparent pricing to help you grow your jewellery business.
                        </p>

                        {/* Billing Cycle Toggle */}
                        <div className="d-flex justify-content-center align-items-center gap-3">
                            <span className={`fw-bold ${billingCycle === 'monthly' ? 'text-dark' : 'text-muted'}`}>Monthly</span>
                            <div className="form-check form-switch custom-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="billingSwitch"
                                    checked={billingCycle === 'yearly'}
                                    onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                                    style={{ width: '3em', height: '1.5em', cursor: 'pointer', backgroundColor: billingCycle === 'yearly' ? brandColor : '#ddd', borderColor: 'transparent' }}
                                />
                            </div>
                            <span className={`fw-bold ${billingCycle === 'yearly' ? 'text-dark' : 'text-muted'}`}>
                                Yearly <span className="badge bg-success ms-1 small">Save up to 17%</span>
                            </span>
                        </div>
                    </div>

                    <Row className="justify-content-center g-4">
                        {plans.map((plan, index) => (
                            <Col key={index} md={6} lg={5} xl={4}>
                                <Card
                                    className="h-100 border-0 rounded-4 overflow-hidden position-relative"
                                    style={{
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        animation: `fadeInUp 0.8s ease-out ${index * 0.2}s both`,
                                        top: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-15px)';
                                        e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(145, 82, 0, 0.15)';
                                        const btn = e.currentTarget.querySelector('.plan-btn');
                                        if (btn) btn.style.transform = 'translateY(-2px) scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.08)';
                                        const btn = e.currentTarget.querySelector('.plan-btn');
                                        if (btn) btn.style.transform = 'translateY(0) scale(1)';
                                    }}
                                >
                                    {plan.recommended && (
                                        <div className="position-absolute w-100 text-center" style={{ top: 0, left: 0, overflow: 'hidden', height: '100px', pointerEvents: 'none' }}>
                                            <div className="bg-warning shadow-sm text-dark fw-bold small py-1 px-5 position-absolute"
                                                style={{
                                                    top: '20px',
                                                    right: '-60px',
                                                    transform: 'rotate(45deg)',
                                                    width: '200px',
                                                    fontSize: '0.7rem',
                                                    letterSpacing: '1px'
                                                }}>
                                                POPULAR
                                            </div>
                                        </div>
                                    )}

                                    <div className={`p-1 w-100 ${plan.recommended ? '' : 'd-none'}`} style={{ background: `linear-gradient(90deg, ${brandColor}, ${goldColor})` }}></div>

                                    <Card.Body className="p-5 d-flex flex-column">
                                        <div className="text-center mb-4">
                                            <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle"
                                                style={{
                                                    width: '60px', height: '60px',
                                                    background: plan.recommended ? `linear-gradient(135deg, ${brandColor}15, ${goldColor}15)` : '#f8f9fa',
                                                    color: brandColor
                                                }}>
                                                <i className={`fas ${plan.name === 'Premium' ? 'fa-crown' : plan.name === 'Standard' ? 'fa-cube' : 'fa-leaf'} fs-4`}></i>
                                            </div>
                                            <h4 className="fw-bold mb-2">{plan.name}</h4>
                                            <div className="d-flex align-items-center justify-content-center flex-column">
                                                <div>
                                                    <span className="h1 fw-bold mb-0" style={{ color: '#2c3e50' }}>{plan.price}</span>
                                                    <span className="text-muted ms-1 align-self-end mb-2">{plan.period}</span>
                                                </div>
                                                {plan.savings && (
                                                    <span className="badge bg-success bg-opacity-10 text-success mt-2 px-3 py-1 rounded-pill">
                                                        {plan.savings}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-grow-1">
                                            <ul className="list-unstyled mb-4">
                                                {plan.features.map((feature, idx) => (
                                                    <li key={idx} className="mb-3 d-flex align-items-center text-muted">
                                                        <i className="fas fa-check-circle me-3" style={{ color: brandColor }}></i>
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <Button
                                            className="w-100 rounded-pill py-3 fw-bold border-0 plan-btn position-relative overflow-hidden"
                                            style={{
                                                background: plan.recommended ? `linear-gradient(90deg, ${brandColor}, ${goldColor})` : '#f1f1f1',
                                                color: plan.recommended ? 'white' : '#333',
                                                transition: 'all 0.3s ease'
                                            }}
                                            // onClick={() => navigate('/register')}
                                            onClick={handleComingSoonShow}
                                        >
                                            <span className="position-relative z-2">Get Started</span>
                                            {plan.recommended && (
                                                <div className="position-absolute top-0 start-0 w-100 h-100"
                                                    style={{
                                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                                        transform: 'translateX(-100%)',
                                                        animation: 'shine 3s infinite'
                                                    }}></div>
                                            )}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Footer */}
            <footer className="py-5 text-white" style={{ backgroundColor: '#1a1a1a' }}>
                <Container>
                    <Row className="g-4 mb-5">
                        <Col md={4}>
                            <h4 className="fw-bold d-flex align-items-center mb-4">
                                <img src="/images/AURUM.png" alt="" height="30" className="me-2" style={{ filter: 'brightness(0) invert(1)' }} />
                                AURUM
                            </h4>
                            <p className="opacity-50 small">
                                The most secure and efficient platform for jewellery merchants to manage chit schemes and grow their business digitally.
                            </p>
                        </Col>
                        <Col md={2} xs={6}>
                            <h6 className="fw-bold mb-3">Platform</h6>
                            <ul className="list-unstyled opacity-75 small space-y-2">
                                <li className="mb-2"><a href="#merchant-flow" className="text-white text-decoration-none">For Merchants</a></li>
                                <li className="mb-2"><a href="#user-flow" className="text-white text-decoration-none">For Customers</a></li>
                                <li className="mb-2"><a href="#plans" className="text-white text-decoration-none">Pricing</a></li>
                            </ul>
                        </Col>
                        <Col md={2} xs={6}>
                            <h6 className="fw-bold mb-3">Company</h6>
                            <ul className="list-unstyled opacity-75 small">
                                <li className="mb-2"><a href="#about" className="text-white text-decoration-none cursor-pointer">About Us</a></li>
                                <li className="mb-2"><a href="/terms" className="text-white text-decoration-none cursor-pointer">Terms & Conditions</a></li>
                                <li className="mb-2"><a href="/privacy" className="text-white text-decoration-none cursor-pointer">Privacy Policy</a></li>
                            </ul>
                        </Col>
                        <Col md={4}>
                            <h6 className="fw-bold mb-3">Headquarters</h6>
                            <ul className="list-unstyled opacity-75 small">
                                <li className="mb-3 d-flex">
                                    <i className="fas fa-map-marker-alt mt-1 me-2" style={{ color: goldColor }}></i>
                                    <a
                                        href="https://maps.app.goo.gl/aQVwRgEjXY9Qd1w8A"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: 'inherit',
                                            textDecoration: 'none',
                                            cursor: 'pointer',
                                            lineHeight: '1.6'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                    >
                                        #303 VSB EDIFICE<br />
                                        Pernambut, Vellore, TN
                                    </a>
                                </li>

                                <li className="mb-2">
                                    <i className="fas fa-envelope me-2" style={{ color: goldColor }}></i>
                                    <span
                                        style={{
                                            cursor: 'pointer',
                                            textDecoration: 'none'
                                        }}
                                        onClick={() => {
                                            window.location.href = 'mailto:info@safprotech.com';
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                    >
                                        info@safprotech.com
                                    </span>
                                </li>


                                <li className="mb-2">
                                    <i className="fas fa-globe me-2" style={{ color: goldColor }}></i>
                                    <a href="https://safprotech.com" className="text-decoration-none fw-bold" style={{ color: goldColor }} target="_blank" rel="noopener noreferrer">www.safprotech.com</a>
                                </li>
                            </ul>
                        </Col>
                    </Row>
                    <div className="border-top border-white border-opacity-10 pt-4 text-center small opacity-50">
                        <p className="mb-1">&copy; {new Date().getFullYear()} AURUM Jewellery. All rights reserved.</p>
                        <p className="mb-0">
                            Powered by <a href="https://safprotech.com" className="text-decoration-none fw-bold" style={{ color: goldColor }} target="_blank" rel="noopener noreferrer">Safpro Technology Solutions</a>
                        </p>
                    </div>
                </Container>
            </footer>

            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&family=Outfit:wght@100..900&display=swap');

                h1, h2, h3, h4, h5, h6, .navbar-brand, .display-1, .display-2, .display-3, .display-4, .display-5 {
                    font-family: 'Outfit', sans-serif;
                }

                .hover-scale {  
                    transition: transform 0.3s ease, box-shadow 0.3s ease; 
                }
                .hover-scale:hover { 
                    transform: scale(1.05); 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
                }
                .transform-hover {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .transform-hover:hover { 
                    transform: translateY(-15px) !important; 
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
                }
                .shadow-hover {
                    transition: all 0.3s ease;
                }
                .shadow-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important;
                }
                .hover-card {
                    transition: all 0.3s ease;
                }
                .hover-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 28px rgba(145, 82, 0, 0.15) !important;
                }
                .backdrop-blur { 
                    backdrop-filter: blur(10px); 
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-25px); }
                }
                
                @keyframes floatMockup {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { 
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% { 
                        transform: scale(1.05);
                        opacity: 0.9;
                    }
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes orbit {
                    from { transform: rotate(0deg) translateX(180px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(180px) rotate(-360deg); }
                }
                
                @keyframes sparkle {
                    0%, 100% { 
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    50% { 
                        transform: scale(1.3) rotate(180deg);
                        opacity: 0.6;
                    }
                }
                
                @keyframes shine {
                    0% { left: -100%; }
                    50%, 100% { left: 150%; }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes iconPop {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    60% {
                        transform: scale(1.2);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                @keyframes progressLine {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                
                /* Smooth scrolling */
                html {
                    scroll-behavior: smooth;
                }
                
                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 10px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #915200;
                    border-radius: 5px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #D4AF37;
                }
                `}
            </style>

            {/* Coming Soon Modal */}
            <Modal show={showComingSoon} onHide={handleComingSoonClose} centered>
                <Modal.Header closeButton className="border-0">
                </Modal.Header>
                <Modal.Body className="text-center pb-5">
                    <div className="mb-4">
                        <img src="/images/AURUM.png" alt="Aurum Logo" height="80" />
                    </div>
                    <h3 className="fw-bold mb-3" style={{ color: brandColor }}>Coming Soon!</h3>
                    <p className="text-muted">
                        We are currently finalizing our registration process to serve you better.
                        Please check back shortly!
                    </p>
                    <Button
                        className="px-4 py-2 mt-3 rounded-pill fw-bold border-0"
                        style={{ background: `linear-gradient(135deg, ${brandColor}, ${goldColor})` }}
                        onClick={handleComingSoonClose}
                    >
                        Got it
                    </Button>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default LandingPage;