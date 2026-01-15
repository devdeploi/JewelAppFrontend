import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal } from 'react-bootstrap';
import BottomNav from './BottomNav';
import './Dashboard.css';
import MerchantProfile from './MerchantProfile';
import ManageChits from './ManageChits';
import SubscriptionExpired from './SubscriptionExpired';
import axios from 'axios';
import { APIURL } from '../utils/Function';

const MerchantDashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [goldRates, setGoldRates] = useState({ buy: 0, sell: 0, loading: true });
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [stats, setStats] = useState({ activePlans: 0, totalEnrolled: 0 });
    const [merchantData, setMerchantData] = useState(user);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [showRenewalModal, setShowRenewalModal] = useState(false);
    const [blockingRenewal, setBlockingRenewal] = useState(false);

    // Fetch latest profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user._id) return;
            try {
                const { data } = await axios.get(`${APIURL}/merchants/${user._id}`);
                setMerchantData(data);
            } catch (error) {
                console.error("Error fetching merchant profile", error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [user._id]);


    // Fetch Chit Plans to calculate stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (activeTab !== 'overview') return;

                if (user._id || user.id) {
                    const id = user._id || user.id;
                    const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${id}?limit=100`);
                    const plans = data.plans || [];
                    const activePlans = plans.length;
                    const totalEnrolled = plans.reduce((acc, plan) => acc + (plan.subscribers ? plan.subscribers.length : 0), 0);
                    setStats({ activePlans, totalEnrolled });
                }
            } catch (error) {
                console.error("Error fetching merchant stats", error);
            }
        };
        fetchStats();
    }, [user, activeTab]);

    // Fetch Gold Price
    useEffect(() => {
        const fetchGoldPrice = async () => {
            try {
                const response = await fetch(
                    "https://data-asg.goldprice.org/dbXRates/INR"
                );

                if (!response.ok) {
                    throw new Error("Gold API failed");
                }

                const data = await response.json();

                // XAU price per ounce in INR
                const pricePerOunce = data?.items?.[0]?.xauPrice;
                if (!pricePerOunce) {
                    throw new Error("Invalid gold data");
                }

                // Convert ounce → gram (24K)
                const pricePerGram24K = pricePerOunce / 31.1035;

                // Chennai market adjustments
                const chennaiAdjusted = pricePerGram24K * 1.01;

                // Buy / Sell spread
                const buyPrice = chennaiAdjusted * 1.03;
                const sellPrice = chennaiAdjusted * 0.97;

                setGoldRates({
                    buy: buyPrice.toFixed(2),
                    sell: sellPrice.toFixed(2),
                    loading: false
                });

            } catch (error) {
                console.error("Gold price fetch failed:", error);
                setGoldRates(prev => ({ ...prev, loading: false }));
            }
        };

        fetchGoldPrice();
        const interval = setInterval(fetchGoldPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loadingProfile && !merchantData) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-warning" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    // Check for Post-Grace Expiry Blocking
    if (!loadingProfile && merchantData?.subscriptionExpiryDate) {
        const expiry = new Date(merchantData.subscriptionExpiryDate);
        const now = new Date();
        const diffTime = now - expiry;
        const diffDays = diffTime / (1000 * 60 * 60 * 24); // Floating point days

        // Post-Grace Period Blocking (> 1 day past expiry)
        if (diffDays > 1 && merchantData.subscriptionStatus === 'expired') {
            if (blockingRenewal) {
                return (
                    <div className="position-relative vh-100 bg-light overflow-auto">
                        <Button
                            variant="light"
                            className="position-absolute top-0 start-0 m-4 z-3 fw-bold shadow-sm"
                            onClick={() => setBlockingRenewal(false)}
                        >
                            <i className="fas fa-arrow-left me-2"></i> Back
                        </Button>
                        <SubscriptionExpired
                            user={merchantData}
                            onRenew={(updatedUser) => {
                                setMerchantData(updatedUser);
                                setBlockingRenewal(false);
                            }}
                            existingPlanCount={stats.activePlans}
                        />
                    </div>
                );
            }

            return (
                <div className="d-flex align-items-center justify-content-center vh-100 bg-light position-relative">
                    <div className="position-absolute w-100 h-100" style={{
                        background: 'radial-gradient(circle at center, #f8f9fa 0%, #e9ecef 100%)',
                    }}></div>

                    <Modal show={true} centered backdrop="static" keyboard={false} contentClassName="shadow-lg border-0 rounded-4">
                        <Modal.Body className="text-center p-5">
                            <div className="mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                                    <i className="fas fa-lock fa-3x"></i>
                                </div>
                                <h3 className="fw-bold mb-2">Subscription Expired</h3>
                                <p className="text-muted">Your grace period has ended. Access to the dashboard is restricted until you renew your plan.</p>
                            </div>
                            <div className="d-grid gap-3">
                                <Button
                                    className="fw-bold py-3 text-white"
                                    size="lg"
                                    style={{ background: 'linear-gradient(45deg, #d4af37, #c5a028)', border: 'none' }}
                                    onClick={() => setBlockingRenewal(true)}
                                >
                                    Renew Subscription Now
                                </Button>
                                <Button variant="outline-secondary" className="py-2" onClick={onLogout}>
                                    Logout
                                </Button>
                            </div>
                        </Modal.Body>
                    </Modal>
                </div>
            );
        }
    }


    // Voluntary Renewal (Grace Period / Expiring Soon) triggered from Dashboard
    if (showRenewalModal) {
        return (
            <div className="position-relative vh-100 bg-light overflow-auto" style={{ zIndex: 2000 }}>
                <Button
                    variant="light"
                    className="position-absolute top-0 start-0 m-4 z-3 fw-bold shadow-sm"
                    onClick={() => setShowRenewalModal(false)}
                >
                    <i className="fas fa-arrow-left me-2"></i> Back to Dashboard
                </Button>
                <SubscriptionExpired
                    user={merchantData}
                    onRenew={(updatedUser) => {
                        setMerchantData(updatedUser);
                        setShowRenewalModal(false);
                    }}
                    existingPlanCount={stats.activePlans}
                />
            </div>
        );
    }

    // Merchant tabs definition
    const merchantTabs = [
        { id: 'overview', icon: 'fa-tachometer-alt', label: 'Overview' },
        { id: 'plans', icon: 'fa-list-alt', label: 'My Plans' },
        { id: 'profile', icon: 'fa-user-cog', label: 'Profile' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="container-fluid p-0">
                        {/* Welcome Banner */}
                        <div
                            className="rounded-4 p-5 mb-5 position-relative overflow-hidden shadow-sm"
                            style={{
                                background: 'linear-gradient(135deg, #f3e9bd 20%, #ebdc87 100%)',
                                minHeight: '200px',
                                color: '#915200'
                            }}
                        >
                            <div className="position-relative" style={{ zIndex: 2 }}>
                                <h1 className="display-5 fw-bold mb-2">Welcome back, {merchantData.name?.split(' ')[0]}!</h1>
                                <p className="lead opacity-75 mb-0 fw-semibold" style={{ maxWidth: '600px' }}>
                                    Here's what's happening with your business today. Track your growth and manage your plans seamlessly.
                                </p>
                            </div>

                            {/* Decorative Background Elements */}
                            <i className="fas fa-crown position-absolute" style={{
                                right: '-20px',
                                top: '-20px',
                                fontSize: '15rem',
                                color: '#ffffff',
                                opacity: 0.05
                            }}></i>
                            <div className="position-absolute" style={{
                                width: '300px',
                                height: '300px',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                                top: '-100px',
                                right: '100px',
                                borderRadius: '50%'
                            }}></div>
                        </div>

                        {/* Expiring Warning */}
                        {(() => {
                            if (merchantData?.subscriptionExpiryDate) {
                                const expiry = new Date(merchantData.subscriptionExpiryDate);
                                const today = new Date();
                                const diffTime = expiry - today;
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                // Show warning if expired (within grace) OR expiring soon (within 7 days)
                                const isExpired = merchantData.subscriptionStatus === 'expired';

                                if (isExpired || (diffDays <= 7 && diffDays > 0)) {
                                    return (
                                        <div className={`alert ${isExpired ? 'alert-danger' : 'alert-warning'} border-0 shadow-sm d-flex align-items-center justify-content-between mb-4`} role="alert">
                                            <div className="d-flex align-items-center">
                                                <i className={`fas ${isExpired ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'} fa-2x me-3`}></i>
                                                <div>
                                                    <h5 className="alert-heading fw-bold mb-1">
                                                        {isExpired ? 'Subscription Expired - Grace Period' : 'Plan Expiring Soon'}
                                                    </h5>
                                                    <p className="mb-0">
                                                        {isExpired
                                                            ? 'You are currently in a grace period. Please renew immediately to avoid account lockout.'
                                                            : <span>Your subscription plan will expire in <strong>{diffDays} days</strong>.</span>
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant={isExpired ? "danger" : "warning"}
                                                className="fw-bold px-4"
                                                onClick={() => setShowRenewalModal(true)}
                                            >
                                                {isExpired ? 'Pay & Renew Now' : 'Renew Plan'}
                                            </Button>
                                        </div>
                                    );
                                }
                            }
                            return null;
                        })()}

                        {/* Stats Grid */}
                        <div className="row g-4 mb-5">
                            {/* Stats Card 1: Active Plans */}
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden hover-card">
                                    <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                        <div>
                                            <p className="text-muted fw-bold text-uppercase small mb-1" style={{ letterSpacing: '1px' }}>Active Plans</p>
                                            <h2 className="display-5 fw-bold mb-0" style={{ color: '#915200' }}>{stats.activePlans}</h2>
                                        </div>
                                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '60px', height: '60px', background: 'rgba(145, 82, 0, 0.1)' }}>
                                            <i className="fas fa-layer-group fa-2x" style={{ color: '#915200' }}></i>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-transparent border-0 pt-0 pb-3 ps-4">
                                        <small className="text-secondary"><i className="fas fa-arrow-up text-success me-1"></i> Running Smoothly</small>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Card 2: Total Subscribers */}
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden hover-card">
                                    <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                        <div>
                                            <p className="text-muted fw-bold text-uppercase small mb-1" style={{ letterSpacing: '1px' }}>Total Subscribers</p>
                                            <h2 className="display-5 fw-bold mb-0" style={{ color: '#915200' }}>{stats.totalEnrolled}</h2>
                                        </div>
                                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '60px', height: '60px', background: 'rgba(145, 82, 0, 0.1)' }}>
                                            <i className="fas fa-users fa-2x" style={{ color: '#915200' }}></i>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-transparent border-0 pt-0 pb-3 ps-4">
                                        <small className="text-secondary"><i className="fas fa-user-plus text-success me-1"></i> Enrolled Customers</small>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Card 3: Total Revenue (Mock/Estimate) */}
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden hover-card">
                                    <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                        <div>
                                            <p className="text-muted fw-bold text-uppercase small mb-1" style={{ letterSpacing: '1px' }}>Est. Revenue</p>
                                            <h2 className="display-5 fw-bold mb-0" style={{ color: '#915200' }}>₹--</h2>
                                        </div>
                                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '60px', height: '60px', background: 'rgba(145, 82, 0, 0.1)' }}>
                                            <i className="fas fa-rupee-sign fa-2x" style={{ color: '#915200' }}></i>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-transparent border-0 pt-0 pb-3 ps-4">
                                        <small className="text-secondary">Analytics coming soon</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <h5 className="fw-bold mb-3" style={{ color: '#915200' }}>Quick Actions</h5>
                            <div className="d-flex gap-3">
                                <Button
                                    className="px-4 py-2 rounded-pill fw-bold"
                                    style={{ background: 'linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)', borderColor: '#915200', color: '#915200' }}
                                    onClick={() => setActiveTab('plans')}
                                >
                                    <i className="fas fa-plus-circle me-2"></i>Create New Plan
                                </Button>
                                <Button
                                    className="px-4 py-2 rounded-pill fw-bold"
                                    variant="outline-dark"
                                    style={{ color: '#915200', borderColor: '#915200' }}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <i className="fas fa-user-edit me-2"></i>Edit Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case 'plans':
                return <ManageChits merchantId={user.id} />; // Pass merchantId if needed by refined ManageChits or just user
            case 'profile':
                return <MerchantProfile merchantData={user} />;
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="d-flex align-items-center">
                    <img src="/images/AURUM.png" alt="Logo" className="me-2" style={{ height: '60px' }} />
                    <h2
                        className="dashboard-title me-3"
                        style={{
                            fontFamily: "'Scheherazade New', serif",
                            fontWeight: 700,
                            color: "#915200",
                            letterSpacing: "1.2px",
                            textShadow: "0 1px 0 #ffd36a, 0 2px 8px #ffffffff",
                        }}
                    >
                        AURUM
                    </h2>
                    <div
                        className="d-none d-lg-flex align-items-center rounded-pill px-3 py-0 shadow-lg"
                        style={{
                            background:
                                "linear-gradient(225deg, #FFF4CC 0%, #E6C866 40%, #C9A441 75%, #A67C00 100%)",
                            border: "1px solid rgba(90,62,18,0.35)",
                            minWidth: "280px",
                        }}
                    >
                        {/* Premium Coin */}
                        <div
                            className="d-flex align-items-center justify-content-center me-3"
                            style={{
                                width: "35px",
                                height: "35px",
                                borderRadius: "50%",
                                background:
                                    "radial-gradient(circle at 30% 30%, #FFF4CC, #C9A441 60%, #A67C00)",
                                boxShadow:
                                    "inset 0 2px 4px rgba(255,255,255,0.6), 0 6px 14px rgba(201,164,65,0.6)",
                                border: "1px solid rgba(90,62,18,0.4)",
                            }}
                        >
                            <i
                                className="fas fa-coins"
                                style={{
                                    fontSize: "1.1rem",
                                    color: "#5A3E12",
                                    textShadow: "0 1px 1px rgba(255,255,255,0.5)",
                                }}
                            />
                        </div>

                        {/* Buy Price */}
                        <div className="d-flex flex-column lh-1 me-4">
                            <span
                                className="fw-semibold text-uppercase"
                                style={{
                                    fontSize: "0.65rem",
                                    letterSpacing: "1.4px",
                                    color: "#6F4E16",
                                }}
                            >
                                24K Gold Buy
                            </span>

                            {goldRates.loading ? (
                                <span className="spinner-border spinner-border-sm text-dark mt-1"></span>
                            ) : (
                                <div className="d-flex align-items-end mt-1">
                                    <span
                                        className="fw-bold"
                                        style={{
                                            fontSize: "1.35rem",
                                            color: "#5A3E12",
                                            letterSpacing: "-0.3px",
                                        }}
                                    >
                                        ₹{goldRates.buy}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            marginLeft: "4px",
                                            color: "#6F4E16",
                                        }}
                                    >
                                        /gm
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Sell Price */}
                        {!goldRates.loading && (
                            <div
                                className="ps-3"
                                style={{
                                    borderLeft: "1px solid rgba(90,62,18,0.35)",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "0.6rem",
                                        letterSpacing: "1.3px",
                                        color: "#6F4E16",
                                    }}
                                >
                                    SELL
                                </span>
                                <span
                                    className="fw-semibold d-block"
                                    style={{
                                        fontSize: "0.9rem",
                                        color: "#5A3E12",
                                    }}
                                >
                                    ₹{goldRates.sell}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    className="rounded-pill px-4 d-flex align-items-center fw-bold"
                    onClick={() => setShowLogoutModal(true)}
                    style={{
                        background: "linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)",
                        border: "1px solid #915200",
                        color: "#915200",
                    }}
                >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                </Button>

            </div>

            {/* Logout Confirmation Modal */}
            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title style={{ color: "#915200" }}>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Confirm Logout
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <h5>Are you sure you want to logout?</h5>
                    <p className="text-muted">You will be returned to the login screen.</p>
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center gap-3 pb-4">
                    <Button variant="light" className="px-4 rounded-pill" onClick={() => setShowLogoutModal(false)}>
                        Cancel
                    </Button>
                    <Button style={{
                        background: "linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)",
                        border: "1px solid #915200",
                        color: "#915200",
                    }} className="px-4 rounded-pill fw-bold" onClick={onLogout}>
                        Yes, Logout
                    </Button>
                </Modal.Footer>
            </Modal>



            {/* Mobile ticker if needed */}
            <div className="d-lg-none bg-light p-2 text-center border-bottom">
                <span className="text-secondary small fw-bold me-2">GOLD (24k):</span>
                <Badge className="me-2 text-white" style={{ background: 'linear-gradient(to right, #4b0082, #00008b)' }}>Buy: ₹{goldRates.buy || '...'}</Badge>
                <Badge className="text-white" style={{ background: 'linear-gradient(to right, #4b0082, #00008b)' }}>Sell: ₹{goldRates.sell || '...'}</Badge>
            </div>

            <div className="dashboard-content">
                {renderContent()}
            </div>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} tabs={merchantTabs} />
        </div>
    );
};

export default MerchantDashboard;
