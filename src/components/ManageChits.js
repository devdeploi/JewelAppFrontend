import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import { APIURL } from '../utils/Function';

import { useRazorpay } from "react-razorpay";

const ManageChits = () => {
    const { Razorpay } = useRazorpay();
    const [myChits, setMyChits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [currentChit, setCurrentChit] = useState(null); // null = new, object = edit
    const [merchantData, setMerchantData] = useState(null); // Validated fresh merchant data
    const [upgradeCycle, setUpgradeCycle] = useState('yearly');
    const [processing, setProcessing] = useState(false);
    const loggedinuser = JSON.parse(localStorage.getItem('user'));
    const merchantId = loggedinuser._id;

    // Custom Alert State
    const [alertState, setAlertState] = useState({
        show: false,
        title: '',
        message: '',
        variant: 'success' // success, danger, warning
    });

    const showAlert = (message, variant = 'danger', title = 'Alert') => {
        setAlertState({ show: true, message, variant, title });
    };

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState({
        show: false,
        message: '',
        onConfirm: null
    });

    const getAuthConfig = useCallback(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        return {
            headers: {
                Authorization: `Bearer ${user?.token}`,
                'Content-Type': 'application/json'
            }
        };
    }, []);

    const fetchMerchantStatus = useCallback(async () => {
        try {
            if (merchantId) {
                const config = getAuthConfig();
                const { data } = await axios.get(`${APIURL}/merchants/${merchantId}`, config);
                setMerchantData(data);
            }
        } catch (error) {
            console.error("Error fetching merchant status", error);
        }
    }, [merchantId, getAuthConfig]);

    const fetchChits = useCallback(async () => {
        try {
            if (merchantId) {
                const data = await axios.get(`${APIURL}/chit-plans/merchant/${merchantId}?limit=100`);
                setMyChits(data.data.plans || []);
            }
        } catch (error) {
            console.error("Error fetching chits", error);
        }
    }, [merchantId]);

    useEffect(() => {
        fetchChits();
        fetchMerchantStatus();
    }, [fetchChits, fetchMerchantStatus]);

    const handleSaveChit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const planData = {
            planName: formData.get('name'), // 'name' in form -> 'planName' in ID
            // RE-READ: user enters "Total Amount" in form field `amount`.
            monthlyAmount: parseFloat((parseFloat(formData.get('amount')) / parseInt(formData.get('duration'))).toFixed(2)),
            durationMonths: parseInt(formData.get('duration')),
            description: formData.get('description'),
            merchant: merchantId, // Ensure merchant ID is sent for new plans
            totalAmount: parseFloat(formData.get('amount')) // Add totalAmount to planData
        };

        // Basic Validation
        if (!planData.planName || !planData.totalAmount || !planData.durationMonths) {
            showAlert("Please fill required fields", "warning", "Missing Info");
            return;
        }

        setProcessing(true);
        try {
            const config = getAuthConfig();
            if (currentChit) {
                // Update
                const { data } = await axios.put(`${APIURL}/chit-plans/${currentChit._id}`, planData, config);
                setMyChits(myChits.map(c => c._id === currentChit._id ? data : c));
                showAlert("Plan updated successfully!", "success", "Success");
            } else {
                // Create
                const { data } = await axios.post(`${APIURL}/chit-plans`, planData, config);
                setMyChits([...myChits, data]);
                showAlert("New plan created successfully!", "success", "Success");
            }
            setShowModal(false);
        } catch (error) {
            console.error("Error saving chit plan", error);
            showAlert("Failed to save plan. Please try again.", "danger", "Error");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmState({
            show: true,
            message: "Are you sure you want to delete this plan? This action cannot be undone.",
            onConfirm: () => executeDelete(id)
        });
    };

    const executeDelete = async (id) => {
        setConfirmState({ ...confirmState, show: false });
        setProcessing(true);
        try {
            const config = getAuthConfig();
            await axios.delete(`${APIURL}/chit-plans/${id}`, config);
            setMyChits(myChits.filter(c => c._id !== id));
            showAlert("Plan deleted successfully.", "success", "Deleted");
        } catch (error) {
            console.error("Error deleting chit plan", error);
            showAlert("Failed to delete plan.", "danger", "Error");
        } finally {
            setProcessing(false);
        }
    };

    // State for form calculation
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState(11);

    const openModal = (chit = null) => {
        setCurrentChit(chit);
        // Initialize form state
        setAmount(chit ? chit.totalAmount : '');
        setDuration(chit ? chit.durationMonths : 11);
        setShowModal(true);
    };

    // Plan Limits & KYC Logic
    const userPlan = merchantData?.plan || loggedinuser?.plan || 'Standard';
    const isPremium = userPlan === 'Premium';
    const planLimit = isPremium ? 6 : 3;
    const currentCount = myChits.length;

    // Check KYC
    // Strict check: Status must be verified AND critical fields must exist
    const isKycVerified =
        merchantData?.bankDetails?.accountNumber &&
        merchantData?.bankDetails?.ifscCode &&
        merchantData?.bankDetails?.accountHolderName &&
        merchantData?.legalName &&
        merchantData?.panNumber;

    const canCreate = isKycVerified && (currentCount < planLimit); // Must be verified AND within limit

    // Helper calculate
    const calculatedMonthly = amount && duration ? (amount / duration).toFixed(2) : 0;

    const handleUpgradeClick = () => {
        setShowUpgradeModal(true);
    };

    const processUpgradePayment = async () => {
        setShowUpgradeModal(false); // Close modal before starting payment logic
        try {
            // 1. Create Order
            const amount = upgradeCycle === 'yearly' ? 50000 : 5000;
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: amount
            });

            // 2. Initialize Razorpay
            const options = {
                key: "rzp_test_S6RoMCiZCpsLo7", // Replace with your actual Key ID
                amount: order.amount,
                currency: order.currency,
                name: "Aurum Jewellery",
                description: "Upgrade to Premium Plan",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post(`${APIURL}/payments/verify-subscription-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.status === 'success') {
                            // Update Plan on Backend
                            const user = JSON.parse(localStorage.getItem('user'));
                            const config = { headers: { Authorization: `Bearer ${user?.token}` } };

                            // We need to fetch current merchant data first to preserve other fields
                            const { data: currentMerchant } = await axios.get(`${APIURL}/merchants/${merchantId}`, config);

                            const updatePayload = {
                                ...currentMerchant,
                                plan: 'Premium',
                                billingCycle: upgradeCycle,
                                paymentId: response.razorpay_payment_id
                            };

                            await axios.put(`${APIURL}/merchants/${merchantId}`, updatePayload, config);

                            // Update Local Storage
                            if (user) {
                                user.plan = 'Premium';
                                localStorage.setItem('user', JSON.stringify(user));
                            }

                            showAlert("Upgrade Successful! You can now create unlimited plans.", "success", "Success");
                            setTimeout(() => window.location.reload(), 2000); // Reload to reflect changes after a short delay
                        }
                    } catch (err) {
                        console.error(err);
                        showAlert("Payment verification failed", "danger", "Error");
                    }
                },
                prefill: {
                    name: loggedinuser.name,
                    email: loggedinuser.email,
                    contact: loggedinuser.phone
                },
                theme: {
                    color: "#915200"
                }
            };

            const rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                showAlert(response.error.description, "danger", "Payment Failed");
            });
            setTimeout(() => {
                rzp1.open();
            }, 2000);

        } catch (error) {
            console.error(error);
            showAlert("Upgrade process failed", "danger", "System Error");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #f3e9bd 0%, #ebdc87 100%)', color: '#915200' }}>
                        <i className="fas fa-coins fa-lg"></i>
                    </div>
                    <div>
                        <h5 style={{ color: '#915200' }} className="mb-0 fw-bold">Manage Chit Plans</h5>
                        <div className="d-flex align-items-center flex-wrap gap-2 mt-1">
                            {merchantData?.subscriptionExpiryDate && (
                                <small className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
                                    Expires: {new Date(merchantData.subscriptionExpiryDate).toLocaleDateString()}
                                </small>
                            )}
                            <span
                                className="text-uppercase badge fw-bold px-2 py-1"
                                style={{
                                    background: 'linear-gradient(135deg, #ebdc87 0%, #e2d183 100%)',
                                    color: '#915200',
                                    fontSize: '0.65rem',
                                    letterSpacing: '0.5px',
                                    border: '1px solid rgba(145, 82, 0, 0.2)',
                                    borderRadius: '4px'
                                }}
                            >
                                {userPlan} Plan
                            </span>
                            <small className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                                ({currentCount} / {planLimit} Chits)
                            </small>
                        </div>
                        {merchantData?.upcomingPlan && (
                            <div className="mt-1">
                                <small className="text-info fw-bold" style={{ fontSize: '0.7rem' }}>
                                    <i className="fas fa-info-circle me-1"></i>
                                    {userPlan} active until expiry, then {merchantData.upcomingPlan}
                                </small>
                            </div>
                        )}
                    </div>
                </div>

                {!canCreate ? (
                    <div className="d-flex gap-2">
                        {!isPremium && isKycVerified && (
                            <Button
                                variant="warning"
                                className="fw-bold rounded-pill text-white"
                                style={{ background: 'linear-gradient(90deg, #ffc107 0%, #ffca2c 100%)', border: 'none' }}
                                onClick={handleUpgradeClick}
                            >
                                <i className="fas fa-crown me-2"></i>Upgrade to Premium
                            </Button>
                        )}
                        <OverlayTrigger
                            placement="left"
                            overlay={<Tooltip>
                                {!isKycVerified
                                    ? "KYC Pending! Please verify Bank details and update PAN info (Legal Name & PAN Number) in Profile to create plans."
                                    : (isPremium ? "Limit Reached! Maximum 6 plans allowed." : "Limit Reached! Upgrade to Premium to add more plans.")}
                            </Tooltip>}
                        >
                            <span className="d-inline-block">
                                <Button
                                    style={{ background: '#e9ecef', borderColor: '#dee2e6', color: '#6c757d', cursor: 'not-allowed' }}
                                    className="fw-bold rounded-pill"
                                    disabled
                                >
                                    <i className="fas fa-lock me-2"></i>Create New Plan
                                </Button>
                            </span>
                        </OverlayTrigger>
                    </div>
                ) : (
                    <div className="d-flex gap-2">
                        {!isPremium && (
                            <Button
                                onClick={handleUpgradeClick}
                                className="fw-bold rounded-pill d-flex align-items-center gap-2 px-4 position-relative overflow-hidden"
                                style={{
                                    background: `
            linear-gradient(
                145deg,
                #915200 0%,
                #a86400 35%,
                #c07a00 50%,
                #a86400 65%,
                #915200 100%
            )
        `,
                                    color: '#ffffff',
                                    border: '1px solid rgba(145, 82, 0, 0.65)',
                                    boxShadow: `
            0 10px 28px rgba(145, 82, 0, 0.45),
            inset 0 1px 1px rgba(255,255,255,0.35),
            inset 0 -2px 6px rgba(0,0,0,0.25)
        `,
                                    transition: 'transform 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* 🔥 Animated Glass Shine */}
                                <span
                                    className="glass-shine"
                                    style={{
                                        position: 'absolute',
                                        top: '-60%',
                                        left: '-70%',
                                        width: '50%',
                                        height: '220%',
                                        background:
                                            'linear-gradient(120deg, rgba(255,255,255,0.45), rgba(255,255,255,0))',
                                        transform: 'rotate(25deg)',
                                        pointerEvents: 'none',
                                        animation: 'none'
                                    }}
                                    ref={(el) => {
                                        if (!el) return;

                                        // Restart shine animation every second
                                        setInterval(() => {
                                            el.style.transition = 'none';
                                            el.style.left = '-70%';

                                            requestAnimationFrame(() => {
                                                el.style.transition = 'left 0.8s ease-in-out';
                                                el.style.left = '120%';
                                            });
                                        }, 3000);
                                    }}
                                />

                                <i className="fas fa-crown"></i>
                                Go Premium
                            </Button>

                        )}
                        <Button
                            style={{ background: 'linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)', borderColor: '#915200', color: '#915200' }}
                            className="fw-bold rounded-pill"
                            onClick={() => openModal()}
                        >
                            <i className="fas fa-plus me-2"></i>Create New Plan
                        </Button>
                    </div>
                )}
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                {myChits.length === 0 ? (
                    <div className="text-center p-5 text-muted">
                        <i className="fas fa-box-open fa-3x mb-3 opacity-50"></i>
                        <p>No chit plans created yet. Start by adding one!</p>
                    </div>
                ) : (
                    <Table responsive hover className="mb-0 custom-table">
                        <thead className="bg-light">
                            <tr>
                                <th>Plan Name</th>
                                {/* <th>Type</th> Type is not in DB model yet */}
                                <th>Monthly / Total</th>
                                <th>Duration</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myChits.map(chit => (
                                <tr key={chit._id}>
                                    <td className="fw-bold">{chit.planName}</td>
                                    {/* <td><div className="badge" style={{ background: '#915200', color: '#fff' }}>Gold</div></td> */}
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span>₹{chit.monthlyAmount}/mo</span>
                                            <small className="text-muted">Total: ₹{chit.totalAmount}</small>
                                        </div>
                                    </td>
                                    <td>{chit.durationMonths} Months</td>
                                    <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{chit.description}</td>
                                    <td>
                                        <Button variant="link" className="p-0 me-3" style={{ color: '#915200' }} onClick={() => openModal(chit)}>
                                            <i className="fas fa-edit"></i>
                                        </Button>
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(chit._id)}>
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card>

            {/* Edit/Create Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title style={{ color: '#915200' }}>{currentChit ? 'Edit Plan' : 'Create New Plan'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSaveChit}>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#915200' }}>Plan Name</Form.Label>
                            <Form.Control name="name" defaultValue={currentChit?.planName} required placeholder="e.g. Gold Saver" />
                        </Form.Group>
                        <Row className="g-3 mb-3">
                            {/* Removed Type select as it's not in backend */}
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label style={{ color: '#915200' }}>Total Amount (₹)</Form.Label>
                                    <Form.Control
                                        name="amount"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        placeholder="5000"
                                    />
                                    {/* <Form.Text className="text-muted">Monthly installment will be calculated.</Form.Text> */}
                                    <div className="mt-2 p-2 bg-light rounded text-center">
                                        <small className="text-muted d-block">Monthly Installment (Approx)</small>
                                        <strong style={{ color: '#915200', fontSize: '1.2rem' }}>₹{calculatedMonthly}</strong>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#915200' }}>Duration (Months)</Form.Label>
                            <Form.Range
                                name="duration"
                                min="1" max="60"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            />
                            <div className="text-center fw-bold" style={{ color: '#915200' }}>{duration} Months</div>
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label style={{ color: '#915200' }}>Description / Benefits</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" defaultValue={currentChit?.description} placeholder="Describe the benefits..." />
                        </Form.Group>
                        <Button
                            style={{ background: 'linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)', borderColor: '#915200', color: '#915200' }} type="submit" className="w-100 rounded-pill fw-bold">
                            Save Plan
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Upgrade Confirmation Modal */}
            <Modal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} centered>
                <Modal.Header closeButton className="border-0 bg-warning bg-opacity-10">
                    <Modal.Title className="fw-bold text-warning-emphasis"><i className="fas fa-crown me-2"></i>Upgrade to Premium</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-4">
                    <div className="mb-3">
                        <img src="/images/AURUM.png" alt="Logo" className="mb-3" style={{ height: '60px' }} />
                        <h4 className="fw-bold">Unlock Unlimited Possibilities</h4>
                        <p className="text-muted">Upgrade to the Premium plan to create unlimited chit plans and grow your business without limits.</p>
                        <hr />
                        <div className="d-flex justify-content-center gap-2 mb-3 mt-4">
                            <Button
                                variant={upgradeCycle === 'monthly' ? 'warning' : 'outline-secondary'}
                                size="sm"
                                className="fw-bold rounded-pill"
                                onClick={() => setUpgradeCycle('monthly')}
                            >
                                Monthly
                            </Button>
                            <Button
                                variant={upgradeCycle === 'yearly' ? 'warning' : 'outline-secondary'}
                                size="sm"
                                className="fw-bold rounded-pill"
                                onClick={() => setUpgradeCycle('yearly')}
                            >
                                Yearly (Save ₹10,000)
                            </Button>
                        </div>
                        <div className="display-6 fw-bold text-success">
                            {upgradeCycle === 'yearly' ? '₹50,000' : '₹5,000'}
                            <span className="fs-6 text-muted">/{upgradeCycle === 'yearly' ? 'year' : 'month'}</span>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center pb-4">
                    <Button variant="light" onClick={() => setShowUpgradeModal(false)} className="px-4 fw-bold text-muted">
                        Cancel
                    </Button>
                    <Button variant="dark" className="px-5 rounded-pill fw-bold" onClick={processUpgradePayment}>
                        Pay & Upgrade
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Processing Overlay Modal */}
            <Modal show={processing} centered backdrop="static" keyboard={false} size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="spinner-border mb-3" role="status" style={{ color: '#915200' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="fw-bold" style={{ color: '#915200' }}>Please Wait</h5>
                    <p className="text-muted mb-0 small">Processing request and sending notifications...</p>
                </Modal.Body>
            </Modal>

            {/* Custom Alert Modal */}
            <Modal
                show={alertState.show}
                onHide={() => setAlertState(prev => ({ ...prev, show: false }))}
                centered
                className="fade"
                contentClassName="border-0 rounded-4 overflow-hidden shadow-lg"
            >
                <div className="p-0 position-relative">
                    <div className="text-center p-4 pt-5">
                        <div
                            className={`mb-4 mx-auto rounded-circle d-flex align-items-center justify-content-center shadow-sm`}
                            style={{
                                width: '80px',
                                height: '80px',
                                background: alertState.variant === 'success' ? '#d1e7dd' : alertState.variant === 'danger' ? '#f8d7da' : '#FFF3CD'
                            }}
                        >
                            <i
                                className={`fas ${alertState.variant === 'success' ? 'fa-check' : alertState.variant === 'danger' ? 'fa-exclamation-triangle' : 'fa-info'} fa-3x`}
                                style={{
                                    color: alertState.variant === 'success' ? '#198754' : alertState.variant === 'danger' ? '#dc3545' : '#856404'
                                }}
                            ></i>
                        </div>

                        <h4 className="fw-bold mb-2" style={{ color: '#915200' }}>
                            {alertState.title}
                        </h4>
                        <p className="text-muted fw-semibold px-4 mb-4">
                            {alertState.message}
                        </p>

                        <button
                            className="btn fw-bold rounded-pill px-5 py-2 text-white shadow-sm"
                            style={{
                                background: 'linear-gradient(90deg, #915200 0%, #a86400 100%)',
                                border: 'none',
                                transition: 'transform 0.2s'
                            }}
                            onClick={() => setAlertState(prev => ({ ...prev, show: false }))}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Okay, Got it
                        </button>
                    </div>
                    {/* Decorative bottom bar */}
                    <div style={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)' }}></div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                show={confirmState.show}
                onHide={() => setConfirmState(prev => ({ ...prev, show: false }))}
                centered
                contentClassName="border-0 rounded-4 overflow-hidden shadow-lg"
            >
                <div className="p-4 pt-5 text-center">
                    <div className="mb-4 mx-auto rounded-circle d-flex align-items-center justify-content-center bg-danger bg-opacity-10" style={{ width: '80px', height: '80px' }}>
                        <i className="fas fa-trash-alt fa-3x text-danger"></i>
                    </div>
                    <h4 className="fw-bold mb-2" style={{ color: '#915200' }}>Are you sure?</h4>
                    <p className="text-muted fw-semibold px-4 mb-4">{confirmState.message}</p>
                    <div className="d-flex gap-3 justify-content-center mb-2">
                        <Button
                            variant="light"
                            className="rounded-pill px-4 fw-bold text-muted"
                            onClick={() => setConfirmState(prev => ({ ...prev, show: false }))}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            className="rounded-pill px-4 fw-bold"
                            onClick={confirmState.onConfirm}
                        >
                            Yes, Delete It
                        </Button>
                    </div>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, #dc3545 0%, #f8d7da 100%)' }}></div>
            </Modal>
        </div>
    );
};

export default ManageChits;
