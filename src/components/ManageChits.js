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
    const loggedinuser = JSON.parse(localStorage.getItem('user'));
    const merchantId = loggedinuser._id;

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
            alert("Please fill required fields");
            return;
        }

        try {
            const config = getAuthConfig();
            if (currentChit) {
                // Update
                const { data } = await axios.put(`${APIURL}/chit-plans/${currentChit._id}`, planData, config);
                setMyChits(myChits.map(c => c._id === currentChit._id ? data : c));
            } else {
                // Create
                const { data } = await axios.post(`${APIURL}/chit-plans`, planData, config);
                setMyChits([...myChits, data]);
            }
            setShowModal(false);
        } catch (error) {
            console.error("Error saving chit plan", error);
            alert("Failed to save plan. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this plan?")) {
            try {
                const config = getAuthConfig();
                await axios.delete(`${APIURL}/chit-plans/${id}`, config);
                setMyChits(myChits.filter(c => c._id !== id));
            } catch (error) {
                console.error("Error deleting chit plan", error);
                alert("Failed to delete plan.");
            }
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
    // Check KYC
    // Strict check: Status must be verified AND critical fields must exist
    const isKycVerified =
        merchantData?.bankDetails?.verificationStatus === 'verified' &&
        merchantData?.bankDetails?.verifiedName;

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
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: 5000
            });

            // 2. Initialize Razorpay
            const options = {
                key: "rzp_test_S0aFMLxRqwkL8z", // Replace with your actual Key ID
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
                                paymentId: response.razorpay_payment_id
                            };

                            await axios.put(`${APIURL}/merchants/${merchantId}`, updatePayload, config);

                            // Update Local Storage
                            if (user) {
                                user.plan = 'Premium';
                                localStorage.setItem('user', JSON.stringify(user));
                            }

                            alert("Upgrade Successful! You can now create unlimited plans.");
                            window.location.reload(); // Reload to reflect changes
                        }
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed");
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
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            alert("Upgrade process failed");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="text-secondary mb-1"><i className="fas fa-coins me-2"></i>Manage Chit Plans</h4>
                    <div className="d-flex align-items-center gap-2">
                        <div
                            className="text-uppercase badge fw-semibold px-3 py-2"
                            style={{
                                background: 'linear-gradient(135deg, #ebdc87 0%, #e2d183 100%)',
                                color: '#915200',
                                // borderRadius: '999px',
                                letterSpacing: '0.5px',
                                boxShadow: '0 4px 10px rgba(145, 82, 0, 0.25)',
                                border: '1px solid rgba(145, 82, 0, 0.3)',
                            }}
                        >
                            {userPlan} Plan
                        </div>


                        <small className="text-muted">
                            ({currentCount} / {planLimit} Chits)
                        </small>


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
                                    ? "KYC Pending! Please verify Bank details in Profile to create plans."
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
                                variant="warning"
                                className="fw-bold rounded-pill"
                                style={{ color: '#fff', borderColor: '#ffc107' }}
                                onClick={handleUpgradeClick}
                            >
                                <i className="fas fa-crown me-2"></i>Go Premium
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
                        <div className="display-6 fw-bold text-success">₹5000<span className="fs-6 text-muted">/year</span></div>
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
        </div>
    );
};

export default ManageChits;
