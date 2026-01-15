import React, { useState } from 'react';
import { Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import { APIURL } from '../utils/Function';

const SubscriptionExpired = ({ user, onRenew, existingPlanCount }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Calculate Expiry Details
    const expiryDate = user.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate) : new Date();
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = diffDays <= 0;

    // Downgrade Management
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [myChits, setMyChits] = useState([]);
    const [loadingChits, setLoadingChits] = useState(false);

    // Standard Limit Logic
    // If expired, we don't disable the button visually, but intercept the click if count > 3 for Standard
    const standardLimit = 3;
    const isStandardRestricted = existingPlanCount > standardLimit;

    const fetchChits = async () => {
        setLoadingChits(true);
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${user._id}?limit=100`, config);
            setMyChits(data.plans || []);
        } catch (error) {
            console.error("Error fetching chits", error);
        } finally {
            setLoadingChits(false);
        }
    };

    const handleDeleteChit = async (id) => {
        if (window.confirm("Are you sure you want to delete this plan? This cannot be undone.")) {
            try {
                const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`${APIURL}/chit-plans/${id}`, config);
                // Update local list
                setMyChits(prev => prev.filter(c => c._id !== id));
            } catch (error) {
                console.error("Error deleting chit plan", error);
                alert("Failed to delete plan.");
            }
        }
    };

    // Derived count from local state if modal is open to reflect real-time deletions
    const currentChitCount = showDowngradeModal ? myChits.length : existingPlanCount;

    const handleRenew = async () => {
        if (!selectedPlan) return;

        // Check for Standard Plan Violation
        if (selectedPlan === 'Standard' && (showDowngradeModal ? currentChitCount > standardLimit : isStandardRestricted)) {
            // Open management modal instead of payment
            if (!showDowngradeModal) {
                fetchChits();
                setShowDowngradeModal(true);
            }
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            // 1. Create Order
            const { data } = await axios.post(`${APIURL}/merchants/create-renewal-order`, { plan: selectedPlan }, config);
            const { order, keyId } = data;

            // 2. Open Razorpay
            const options = {
                key: keyId, // Use key from backend
                amount: order.amount,
                currency: order.currency,
                name: "AURUM",
                description: `Renew ${selectedPlan} Plan`,
                image: "/images/AURUM.png",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        setLoading(true);
                        // 3. Verify Payment
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: selectedPlan
                        };

                        const { data } = await axios.post(`${APIURL}/merchants/verify-renewal`, verifyPayload, config);

                        if (data.success) {
                            // Update Local Storage
                            const storedUser = JSON.parse(localStorage.getItem('user'));
                            if (storedUser) {
                                const updated = { ...storedUser, ...data.merchant };
                                localStorage.setItem('user', JSON.stringify(updated));
                            }
                            setShowSuccess(true);
                            setTimeout(() => onRenew(data.merchant), 3000); // Redirect after 3s
                        }
                    } catch (err) {
                        setError('Payment verification failed');
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: {
                    color: "#915200"
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Renewal initiation failed. Please try again.');
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
                <div className="text-center animate__animated animate__fadeIn">
                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-white shadow mx-auto mb-4" style={{ width: '120px', height: '120px' }}>
                        <i className="fas fa-check-circle fa-4x text-success"></i>
                    </div>
                    <h2 className="fw-bold mb-3" style={{ color: '#915200' }}>Payment Successful!</h2>
                    <p className="text-muted lead mb-4">Your <strong>{selectedPlan}</strong> plan has been renewed successfully.</p>
                    <div className="spinner-border text-warning" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="small text-muted mt-2">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    if (showDowngradeModal) {
        return (
            <div className="d-flex align-items-center justify-content-center bg-light min-vh-100 py-4">
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-header bg-white border-0 pt-4 px-4">
                            <h4 className="fw-bold text-danger mb-0"><i className="fas fa-exclamation-triangle me-2"></i>Action Required</h4>
                            <p className="text-muted mt-2">
                                You have selected the <strong>Standard Plan</strong> (Max 3 Chits), but you currently have <strong>{myChits.length}</strong> active chit plans.
                            </p>
                        </div>
                        <div className="card-body px-4">
                            <div className="alert alert-warning border-0 d-flex align-items-center">
                                <i className="fas fa-info-circle me-3 fa-2x"></i>
                                <div>
                                    Please delete <strong>{myChits.length - standardLimit}</strong> plan(s) to continue with the Standard renewal.
                                    Or switch to Premium to keep all plans.
                                </div>
                            </div>

                            {loadingChits ? (
                                <div className="text-center py-5"><div className="spinner-border text-secondary"></div></div>
                            ) : (
                                <div className="list-group list-group-flush border rounded-3 overflow-hidden mb-3">
                                    {myChits.map(chit => (
                                        <div key={chit._id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                            <div>
                                                <h6 className="mb-0 fw-bold text-dark">{chit.planName}</h6>
                                                <small className="text-muted">₹{chit.totalAmount} • {chit.durationMonths} Months</small>
                                            </div>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="rounded-pill px-3"
                                                onClick={() => handleDeleteChit(chit._id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="card-footer bg-white border-0 pb-4 px-4 d-flex justify-content-between align-items-center">
                            <Button variant="link" className="text-secondary text-decoration-none" onClick={() => setShowDowngradeModal(false)}>
                                &larr; Back to Plans
                            </Button>
                            <Button
                                variant={currentChitCount <= standardLimit ? "success" : "secondary"}
                                className="px-4 rounded-pill fw-bold"
                                disabled={currentChitCount > standardLimit}
                                onClick={handleRenew}
                            >
                                {currentChitCount <= standardLimit ? 'Proceed with Payment' : `Delete ${currentChitCount - standardLimit} More`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Selection UI
    return (
        <div className="d-flex align-items-center justify-content-center bg-light h-100 py-4">
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                    <div className="card-header text-white text-center py-4" style={{ background: 'linear-gradient(135deg, #915200 0%, #d4af37 100%)' }}>
                        <h2 className="mb-0 fw-bold">
                            <i className={`fas ${isExpired ? 'fa-history' : 'fa-clock'} me-2`}></i>
                            {isExpired ? 'Subscription Expired' : 'Renew Subscription'}
                        </h2>

                        <div className="mt-3 d-inline-flex bg-white bg-opacity-25 px-4 py-2 rounded-4 text-start align-items-center">
                            <div className="pe-3 border-end border-white border-opacity-50">
                                <small className="d-block opacity-75 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Current Plan</small>
                                <div className="fw-bold fs-5">{user.plan || 'Standard'}</div>
                            </div>
                            <div className="ps-3">
                                <small className="d-block opacity-75 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Status</small>
                                <div className="fw-bold fs-5">
                                    {isExpired
                                        ? `Expired on ${expiryDate.toLocaleDateString()}`
                                        : `${diffDays} Days Remaining`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card-body p-5">
                        {error && <Alert variant="danger">{error}</Alert>}

                        <h5 className="text-center mb-4 text-secondary">
                            You have used <strong>{existingPlanCount}</strong> chit slots.
                            {/* Warning derived from dynamic logic now */}
                        </h5>

                        <Row className="g-4 mb-4 justify-content-center">
                            {/* Standard Plan */}
                            <Col md={6}>
                                <div
                                    className={`card h-100 cursor-pointer transition-all ${selectedPlan === 'Standard' ? 'border-primary ring-2' : ''} ${selectedPlan !== 'Standard' ? 'hover-shadow' : ''}`}
                                    onClick={() => setSelectedPlan('Standard')}
                                    style={{
                                        cursor: 'pointer',
                                        border: selectedPlan === 'Standard' ? '2px solid #915200' : '1px solid #e0e0e0',
                                        backgroundColor: selectedPlan === 'Standard' ? '#fffaf0' : '#fff'
                                    }}
                                >
                                    <div className="card-body text-center p-4">
                                        <h5 className="fw-bold text-dark">Standard Plan</h5>
                                        <h4 className="my-3 text-secondary fw-bold">1500/mon</h4>
                                        <ul className="list-unstyled text-start small text-muted mx-auto" style={{ maxWidth: '200px' }}>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Up to 3 Chit Plans</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Basic Analytics</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Standard Support</li>
                                        </ul>
                                        {/* Show warning if checking would trigger downgrade flow */}
                                        {isStandardRestricted && (
                                            <div className="text-warning small mt-2 fw-bold">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Requires deleting plans
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Col>

                            {/* Premium Plan */}
                            <Col md={6}>
                                <div
                                    className={`card h-100 cursor-pointer transition-all ${selectedPlan === 'Premium' ? 'border-primary ring-2' : 'hover-shadow'}`}
                                    onClick={() => setSelectedPlan('Premium')}
                                    style={{
                                        cursor: 'pointer',
                                        border: selectedPlan === 'Premium' ? '2px solid #915200' : '1px solid #e0e0e0',
                                        backgroundColor: selectedPlan === 'Premium' ? '#fffaf0' : '#fff'
                                    }}
                                >
                                    <div className="card-body text-center p-4">
                                        <div className="position-absolute top-0 end-0 m-2">
                                            <span className="badge bg-warning text-dark">Recommended</span>
                                        </div>
                                        <h5 className="fw-bold text-dark">Premium Plan</h5>
                                        <h4 className="my-3 text-warning fw-bold">5000/mon</h4>
                                        <ul className="list-unstyled text-start small text-muted mx-auto" style={{ maxWidth: '200px' }}>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Up to 6 Chits</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Advanced Analytics</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Priority Support</li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <div className="text-center">
                            <Button
                                size="lg"
                                className="px-5 rounded-pill fw-bold"
                                disabled={!selectedPlan || loading}
                                onClick={handleRenew}
                                style={{
                                    background: 'linear-gradient(90deg, #915200 0%, #d4af37 100%)',
                                    border: 'none'
                                }}
                            >
                                {loading ? 'Processing...' : 'Renew Subscription'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionExpired;
