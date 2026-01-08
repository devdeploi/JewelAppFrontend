import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Modal } from 'react-bootstrap';
import MerchantList from './MerchantList';
import UserList from './UserList';
import Subscribers from './Subscribers';
import BottomNav from './BottomNav';
import './Dashboard.css';
import axios from 'axios';
import { APIURL } from '../utils/Function';

const Dashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [goldRates, setGoldRates] = useState({ buy: 0, sell: 0, loading: true });
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const [stats, setStats] = useState({
        merchantsCount: 0,
        usersCount: 0,
        pendingMerchants: 0
    });

    const [userName, setUserName] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setUserName(user.name);
        }

        // ... existing gold price fetch ...
        const fetchGoldPrice = async () => {
            // ... (keep this logic)
            try {
                const response = await fetch(
                    "https://data-asg.goldprice.org/dbXRates/INR"
                );
                if (!response.ok) throw new Error("Gold API failed");
                const data = await response.json();
                const pricePerOunce = data?.items?.[0]?.xauPrice;
                if (!pricePerOunce) throw new Error("Invalid gold data");
                const pricePerGram24K = pricePerOunce / 31.1035;
                const chennaiAdjusted = pricePerGram24K * 1.01;
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

        const fetchStats = async () => {
            try {
                // Fetch stats only if overview is active to save bandwidth
                if (activeTab !== 'overview') return;

                const user = JSON.parse(localStorage.getItem('user'));
                const token = user?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${APIURL}/merchants?limit=10`, config); // Minimize data
                const response2 = await axios.get(`${APIURL}/users?limit=10`, config);
                const pendingResponse = await axios.get(`${APIURL}/merchants?status=Pending&limit=10`, config);

                setStats({
                    merchantsCount: response.data.pagination.totalRecords || 0,
                    usersCount: response2.data.total || 0,
                    pendingMerchants: pendingResponse.data.pagination.totalRecords || 0
                });

            } catch (error) {
                console.error("Stats fetch failed", error);
            }
        };

        fetchGoldPrice();
        fetchStats();

        const interval = setInterval(() => {
            fetchGoldPrice();
            fetchStats();
        }, 60000);
        return () => clearInterval(interval);
    }, [activeTab]);



    const renderContent = () => {
        switch (activeTab) {
            case 'merchants':
                return <MerchantList />;
            case 'users':
                return <UserList />;
            case 'subscribers':
                return <Subscribers />;
            case 'overview':
            default:
                return (
                    <Row className="g-4">
                        <Col md={3}>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper" style={{ background: "#FFD36A", color: "#915200" }}>
                                    <i className="fas fa-store"></i>
                                </div>
                                <h3 className="stat-value">{stats.merchantsCount}</h3>
                                <div className="stat-label">Total Merchants</div>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper" style={{ background: "#FFD36A", color: "#915200" }}>
                                    <i className="fas fa-user"></i>
                                </div>
                                <h3 className="stat-value">{stats.usersCount}</h3>
                                <div className="stat-label">Total Users</div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="stat-card premium-stat">
                                <h3>Welcome Back, {userName || 'Admin'}</h3>
                                <p className="mb-0 text-white-50">You have {stats.pendingMerchants} pending merchant approvals today.</p>
                            </div>
                        </Col>
                        <Col md={12} className="mt-4">
                            <Subscribers />
                        </Col>
                    </Row>
                );
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="d-flex align-items-center">
                    <img src="/images/AURUM.png" alt="Logo" className="me-2" style={{ height: '60px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '50%', padding: '5px' }} />
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

            {/* Main Content */}
            <div className="dashboard-content animate__animated animate__fadeIn">
                {renderContent()}
            </div>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Logout Confirmation Modal */}
            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title style={{ color: "#915200" }}>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Confirm Logout
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <h5>Are you sure you want to log out?</h5>
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
        </div>
    );
};

export default Dashboard;
