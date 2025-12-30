import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal } from 'react-bootstrap';
import BottomNav from './BottomNav';
import './Dashboard.css';
import MerchantProfile from './MerchantProfile';
import ManageChits from './ManageChits';

const MerchantDashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [goldRates, setGoldRates] = useState({ buy: 0, sell: 0, loading: true });
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Fetch Gold Price
    useEffect(() => {
        const fetchGoldPrice = async () => {
            try {
                // Using GoldPrice.org public data feed
                const response = await fetch('https://data-asg.goldprice.org/dbXRates/INR');
                if (!response.ok) throw new Error('Network response was not ok');

                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    const pricePerOunce = data.items[0].xauPrice;
                    // 1 Troy Ounce = 31.1035 grams
                    const marketPrice = pricePerOunce / 31.1035;

                    // Simulate Buy/Sell Spread
                    // Buy is slightly higher (Market + Premium)
                    // Sell is slightly lower (Market - Margin)
                    const buyPrice = marketPrice * 1.03; // +3%
                    const sellPrice = marketPrice * 0.97; // -3%

                    setGoldRates({
                        buy: buyPrice.toFixed(2),
                        sell: sellPrice.toFixed(2),
                        loading: false
                    });
                }
            } catch (error) {
                console.error("Failed to fetch gold price", error);
                setGoldRates(prev => ({ ...prev, loading: false }));
            }
        };

        fetchGoldPrice();
        // Refresh every minute
        const interval = setInterval(fetchGoldPrice, 60000);
        return () => clearInterval(interval);
    }, []);

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
                    <div className="text-center mt-5">
                        <h2 className="text-secondary">Welcome, {user.name}</h2>
                        <p className="lead text-muted">Manage your business and chit plans efficiently.</p>
                        <div className="row g-4 mt-4 justify-content-center">
                            <div className="col-md-5">
                                <div className="card border-0 shadow-sm p-4 text-center">
                                    <h1 className="display-4 text-primary fw-bold">4</h1>
                                    <p className="text-muted">Active Plans</p>
                                </div>
                            </div>
                            <div className="col-md-5">
                                <div className="card border-0 shadow-sm p-4 text-center">
                                    <h1 className="display-4 text-success fw-bold">128</h1>
                                    <p className="text-muted">Total Enrolled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'plans':
                return <ManageChits merchantId={user.id} />;
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
                    <h2 className="dashboard-title mb-0 me-4">
                        <i className="fas fa-gem text-warning me-2"></i>
                        Merchant Portal
                    </h2>

                    {/* Gold Rates Ticker in Navbar - Jar App Style */}
                    <div className="d-none d-lg-flex align-items-center rounded-pill ps-2 pe-4 py-1 shadow"
                        style={{
                            background: "linear-gradient(220deg, #4b0082 0%, #00008b 100%)", // Deep dark violet
                            border: "1px solid rgba(255,255,255,0.15)",
                            minWidth: "260px"
                        }}>
                        {/* Gold Icon */}
                        <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center me-3"
                            style={{ width: '36px', height: '36px', boxShadow: '0 0 15px rgba(255, 193, 7, 0.4)' }}>
                            <i className="fas fa-coins text-white"></i>
                        </div>

                        {/* Buy Price Main */}
                        <div className="d-flex flex-column lh-1 me-4">
                            <span className="text-white-50 text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>24K Gold Buy</span>
                            {goldRates.loading ? (
                                <span className="spinner-border spinner-border-sm text-white mt-1" role="status"></span>
                            ) : (
                                <div className="d-flex align-items-baseline mt-1">
                                    <span className="fw-bold text-white fs-5">₹{goldRates.buy}</span>
                                    <span className="text-white-50 ms-1" style={{ fontSize: '0.8rem' }}>/gm</span>
                                </div>
                            )}
                        </div>

                        {/* Sell Price Secondary */}
                        {!goldRates.loading && (
                            <div className="border-start border-white border-opacity-10 ps-3">
                                <span className="d-block text-white-50" style={{ fontSize: '0.65rem' }}>Sell Price</span>
                                <span className="d-block text-warning fw-bold" style={{ fontSize: '0.85rem' }}>₹{goldRates.sell}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <span className="text-secondary fw-bold d-none d-md-block">{user.name} ({user.plan})</span>
                    <Button variant="outline-danger" className="rounded-pill px-4" onClick={() => setShowLogoutModal(true)}>
                        <i className="fas fa-sign-out-alt me-2"></i>
                        Logout
                    </Button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="text-danger">
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
                    <Button variant="danger" className="px-4 rounded-pill" onClick={onLogout}>
                        Yes, Logout
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Mobile ticker if needed, or kept hidden */}
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
