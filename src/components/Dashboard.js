import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Modal } from 'react-bootstrap';
import MerchantList from './MerchantList';
import UserList from './UserList';
import Subscribers from './Subscribers';
import BottomNav from './BottomNav';
import './Dashboard.css';
import axios from 'axios';
import { APIURL } from '../utils/Function';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const Dashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [goldRates, setGoldRates] = useState({ buy: 0, sell: 0, loading: true });
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const [stats, setStats] = useState({
        merchantsCount: 0,
        usersCount: 0,
        pendingMerchants: 0,
        approvedMerchants: 0,
        rejectedMerchants: 0,
        monthlyRevenue: 0 // Mock or calc
    });

    const [chartData, setChartData] = useState({
        merchantDistribution: null,
        userGrowth: null
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
                // India Market Adjustments (2026) -> ~11% Markup
                const marketMarkup = 1.11;
                const buyPrice = pricePerGram24K * marketMarkup;
                const sellPrice = buyPrice * 0.96;
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
                const response = await axios.get(`${APIURL}/merchants?limit=1`, config);
                const response2 = await axios.get(`${APIURL}/users?limit=1`, config);
                const pendingResponse = await axios.get(`${APIURL}/merchants?status=Pending&limit=1`, config);
                const approvedResponse = await axios.get(`${APIURL}/merchants?status=Approved&limit=1`, config);
                const rejectedResponse = await axios.get(`${APIURL}/merchants?status=Rejected&limit=1`, config);

                const totalMerchants = response.data.pagination.totalRecords || 0;
                const totalUsers = response2.data.total || 0;
                const pending = pendingResponse.data.pagination.totalRecords || 0;
                const approved = approvedResponse.data.pagination.totalRecords || 0;
                const rejected = rejectedResponse.data.pagination.totalRecords || 0;

                setStats({
                    merchantsCount: totalMerchants,
                    usersCount: totalUsers,
                    pendingMerchants: pending,
                    approvedMerchants: approved,
                    rejectedMerchants: rejected
                });

                // Prepare Chart Data
                setChartData({
                    merchantDistribution: {
                        labels: ['Approved', 'Pending', 'Rejected'],
                        datasets: [
                            {
                                data: [approved, pending, rejected],
                                backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                                hoverOffset: 4
                            },
                        ],
                    },
                    userGrowth: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // Mock labels
                        datasets: [
                            {
                                label: 'User Growth',
                                data: [totalUsers * 0.2, totalUsers * 0.3, totalUsers * 0.5, totalUsers * 0.7, totalUsers * 0.85, totalUsers], // Mock trend matching total
                                fill: true,
                                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                borderColor: '#D4AF37',
                                tension: 0.4
                            }
                        ]
                    }
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
                    <div className="container-fluid p-0 fade-in-up">
                        {/* Styles for Animations */}
                        <style>{`
                            @keyframes shimmer { 0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); } 100% { transform: translateX(300%) translateY(300%) rotate(30deg); } }
                            @keyframes goldPulse { 0%, 100% { box-shadow: 0 0 20px rgba(145, 82, 0, 0.2); } 50% { box-shadow: 0 0 30px rgba(183, 121, 31, 0.3); } }
                            @keyframes shine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                            .gold-card-shine { animation: goldPulse 3s ease-in-out infinite; }
                            .gold-card-shine::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.6) 50%, transparent 70%); animation: shimmer 3s infinite; pointer-events: none; }
                            .price-shimmer { background: linear-gradient(90deg, #915200 0%, #b7791f 25%, #d4af37 50%, #b7791f 75%, #915200 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shine 3s linear infinite; }
                        `}</style>

                        {/* Welcome Banner */}
                        <div className="border-0 rounded-4 mb-4 overflow-hidden">                            <div className="card-body p-4 d-flex align-items-center justify-content-between position-relative">
                            <div className="position-absolute end-0 top-0 h-100 w-50" style={{ background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.05))', clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }}></div>
                            <div className="position-relative z-1">
                                <h2 className="fw-bold mb-1">Welcome Back, {userName || 'Admin'}!</h2>
                                <p className="mb-0 text-muted">Here's what's happening in your dashboard today.</p>
                            </div>
                            {/* <div className="badge bg-warning text-dark fw-bold px-4 py-2 rounded-pill fs-6 shadow">
                                    <i className="fas fa-crown me-2"></i>Admin Access
                                </div> */}
                        </div>
                        </div>

                        {/* Gold Rates Card */}
                        <div className="card border-0 rounded-4 mb-4 overflow-hidden position-relative gold-card-shine"
                            style={{ background: 'linear-gradient(145deg, #fef9e7 0%, #fff8dc 50%, #fffacd 100%)', border: '1px solid rgba(145, 82, 0, 0.2)' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="position-relative" style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #d4af37 0%, #b7791f 50%, #915200 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(145, 82, 0, 0.3)' }}>
                                            <i className="fas fa-coins text-white"></i>
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-0" style={{ color: '#915200' }}>Live Gold Rates</h5>
                                            <small className="text-muted">Real-time market updates</small>
                                        </div>
                                    </div>
                                    <span className="badge bg-danger rounded-pill px-3 py-2">LIVE</span>
                                </div>
                                <Row className="g-3">
                                    {[
                                        { label: '24K', price: goldRates.buy24 || goldRates.buy }, // Fallback to buy if distinct 24k not set
                                        { label: '22K', price: goldRates.buy22 || ((goldRates.buy * 22) / 24).toFixed(2) },
                                        { label: '18K', price: goldRates.buy18 || ((goldRates.buy * 18) / 24).toFixed(2) }
                                    ].map((rate, idx) => (
                                        <Col key={idx} xs={4}>
                                            <div className="text-center p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(145,82,0,0.1)' }}>
                                                <div className="badge bg-warning bg-opacity-25 text-dark mb-2">{rate.label}</div>
                                                <h4 className="fw-bold mb-0 price-shimmer">₹{rate.price}</h4>
                                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>per gram</small>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </div>

                        {/* Stat Cards */}
                        <Row className="g-4 mb-4">
                            {[
                                { title: 'Total Merchants', value: stats.merchantsCount, icon: 'fa-store', color: '#915200' },
                                { title: 'Total Users', value: stats.usersCount, icon: 'fa-users', color: '#198754' },
                                { title: 'Pending Requests', value: stats.pendingMerchants, icon: 'fa-clock', color: '#fd7e14' },
                                { title: 'Active Plans', value: '45', icon: 'fa-file-invoice-dollar', color: '#0d6efd' } // Mock until available
                            ].map((stat, idx) => (
                                <Col md={3} key={idx}>
                                    <div className="card border-0 shadow-sm rounded-4 h-100">
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div className="rounded-circle p-3 d-flex align-items-center justify-content-center"
                                                    style={{ width: '50px', height: '50px', backgroundColor: `${stat.color}20`, color: stat.color }}>
                                                    <i className={`fas ${stat.icon} fa-lg`}></i>
                                                </div>
                                            </div>
                                            <h6 className="text-muted text-uppercase small fw-bold">{stat.title}</h6>
                                            <h3 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>{stat.value}</h3>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        {/* Charts Row */}
                        <Row className="g-4">
                            <Col md={4}>
                                <div className="card border-0 shadow-sm rounded-4 h-100">
                                    <div className="card-body p-4">
                                        <h5 className="fw-bold mb-4" style={{ color: '#915200' }}>Merchant Status</h5>
                                        <div style={{ height: '250px', position: 'relative' }}>
                                            {chartData.merchantDistribution && (
                                                <Doughnut
                                                    data={chartData.merchantDistribution}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { position: 'bottom' } },
                                                        cutout: '70%'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col md={8}>
                                <div className="card border-0 shadow-sm rounded-4 h-100">
                                    <div className="card-body p-4">
                                        <h5 className="fw-bold mb-4" style={{ color: '#915200' }}>User Growth Trend</h5>
                                        <div style={{ height: '250px' }}>
                                            {chartData.userGrowth && (
                                                <Line
                                                    data={chartData.userGrowth}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false } },
                                                        scales: {
                                                            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                                                            x: { grid: { display: false } }
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
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
                </div>

                <Button
                    className="rounded-pill px-4 d-flex align-items-center fw-bold ms-auto" // Added ms-auto to push to right
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
