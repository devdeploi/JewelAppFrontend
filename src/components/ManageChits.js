import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, OverlayTrigger, Tooltip, Pagination, Badge } from 'react-bootstrap';
import axios from 'axios';
import { APIURL } from '../utils/Function';

import { useRazorpay } from "react-razorpay";

const PRICING = {
    Standard: {
        monthly: 2360,
        yearly: 23600,
        baseMonthly: 2000,
        baseYearly: 20000,
        limit: 6,
        benefits: [
            "Create up to 6 Chit Plans",
            "Basic Report Access",
            "Standard Support",
            "Email Validations"
        ]
    },
    Premium: {
        monthly: 4130,
        yearly: 41300,
        baseMonthly: 3500,
        baseYearly: 35000,
        limit: 9, // Or unlimited based on context, but code says 9
        benefits: [
            "Create up to 9 Chit Plans",
            "iOS App Access",
            "Custom Ads Manager",
            "Payment Filter (Date)",
            "Priority Support",
            "Advanced Analytics"
        ]
    }
};

const ManageChits = () => {
    const { Razorpay } = useRazorpay();
    const [myChits, setMyChits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [currentChit, setCurrentChit] = useState(null); // null = new, object = edit
    const [merchantData, setMerchantData] = useState(null); // Validated fresh merchant data

    // Upgrade State
    const [upgradeCycle, setUpgradeCycle] = useState('yearly');
    const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null); // 'Standard' or 'Premium'

    const [processing, setProcessing] = useState(false);
    const loggedinuser = JSON.parse(localStorage.getItem('user'));
    const merchantId = loggedinuser._id;

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);

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
            planName: formData.get('name'),
            monthlyAmount: parseFloat((parseFloat(formData.get('amount')) / parseInt(formData.get('duration'))).toFixed(2)),
            durationMonths: parseInt(formData.get('duration')),
            description: formData.get('description'),
            merchant: merchantId,
            totalAmount: parseFloat(formData.get('amount')),
            returnType: formData.get('returnType')
        };

        if (!planData.planName || !planData.totalAmount || !planData.durationMonths) {
            showAlert("Please fill required fields", "warning", "Missing Info");
            return;
        }

        setProcessing(true);
        try {
            const config = getAuthConfig();
            if (currentChit) {
                const { data } = await axios.put(`${APIURL}/chit-plans/${currentChit._id}`, planData, config);
                setMyChits(myChits.map(c => c._id === currentChit._id ? data : c));
                showAlert("Plan updated successfully!", "success", "Success");
            } else {
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
    const [returnType, setReturnType] = useState('Cash');

    const openModal = (chit = null) => {
        setCurrentChit(chit);
        setAmount(chit ? chit.totalAmount : '');
        setDuration(chit ? chit.durationMonths : 11);
        setReturnType(chit ? (chit.returnType || 'Cash') : 'Cash');
        setShowModal(true);
    };

    // Plan Limits Check
    // Default to 'Basic' if no plan is set (Logic change from 'Standard' default)
    const userPlan = merchantData?.plan || loggedinuser?.plan || 'Basic';
    const isPremium = userPlan === 'Premium';

    let planLimit = 3; // Basic Limit
    if (userPlan === 'Standard') planLimit = 6;
    if (userPlan === 'Premium') planLimit = 9;

    const currentCount = myChits.length;

    const isKycVerified =
        merchantData?.bankDetails?.accountNumber &&
        merchantData?.bankDetails?.ifscCode &&
        merchantData?.bankDetails?.accountHolderName &&
        merchantData?.legalName &&
        merchantData?.panNumber;

    const canCreate = isKycVerified && (currentCount < planLimit);

    const calculatedMonthly = amount && duration ? (amount / duration).toFixed(2) : 0;

    const handleUpgradeClick = () => {
        // Reset selected plan based on current tier
        if (userPlan === 'Basic') {
            setSelectedUpgradePlan(null); // Force selection
        } else if (userPlan === 'Standard') {
            setSelectedUpgradePlan('Premium'); // Only option is Premium
        }
        setShowUpgradeModal(true);
    };

    const processUpgradePayment = async () => {
        if (!selectedUpgradePlan) return;

        setShowUpgradeModal(false);
        try {
            // Determine Amount
            const pricing = PRICING[selectedUpgradePlan];
            const amount = upgradeCycle === 'yearly' ? pricing.yearly : pricing.monthly;

            // 1. Create Order
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: amount
            });

            // 2. Initialize Razorpay
            const options = {
                key: process.env.RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Aurum Jewellery",
                description: `Upgrade to ${selectedUpgradePlan} Plan`,
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

                            const { data: currentMerchant } = await axios.get(`${APIURL}/merchants/${merchantId}`, config);

                            const updatePayload = {
                                ...currentMerchant,
                                plan: selectedUpgradePlan, // Use selected plan
                                billingCycle: upgradeCycle,
                                paymentId: response.razorpay_payment_id
                            };

                            await axios.put(`${APIURL}/merchants/${merchantId}`, updatePayload, config);

                            // Update Local Storage
                            if (user) {
                                user.plan = selectedUpgradePlan;
                                localStorage.setItem('user', JSON.stringify(user));
                            }

                            showAlert(`Upgrade to ${selectedUpgradePlan} Successful!`, "success", "Success");
                            setTimeout(() => window.location.reload(), 2000);
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

    // Calculate Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentChits = myChits.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(myChits.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
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
                                <i className="fas fa-crown me-2"></i>Upgrade Plan
                            </Button>
                        )}
                        <OverlayTrigger
                            placement="left"
                            overlay={<Tooltip>
                                {!isKycVerified
                                    ? "KYC Pending! Please verify Bank details in Profile."
                                    : (isPremium ? `Limit Reached! Maximum ${planLimit} plans allowed.` : "Limit Reached! Upgrade to add more plans.")}
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
                                    background: `linear-gradient(145deg, #915200 0%, #a86400 35%, #c07a00 50%, #a86400 65%, #915200 100%)`,
                                    color: '#ffffff',
                                    border: '1px solid rgba(145, 82, 0, 0.65)',
                                    boxShadow: `0 10px 28px rgba(145, 82, 0, 0.45), inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.25)`,
                                    transition: 'transform 0.3s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <span className="glass-shine"
                                    style={{
                                        position: 'absolute', top: '-60%', left: '-70%', width: '50%', height: '220%',
                                        background: 'linear-gradient(120deg, rgba(255,255,255,0.45), rgba(255,255,255,0))',
                                        transform: 'rotate(25deg)', pointerEvents: 'none', animation: 'none'
                                    }}
                                    ref={(el) => {
                                        if (!el) return;
                                        setInterval(() => {
                                            el.style.transition = 'none'; el.style.left = '-70%';
                                            requestAnimationFrame(() => { el.style.transition = 'left 0.8s ease-in-out'; el.style.left = '120%'; });
                                        }, 3000);
                                    }}
                                />
                                <i className="fas fa-arrow-up"></i> Upgrade
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

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-3">
                {myChits.length === 0 ? (
                    <div className="text-center p-5 text-muted">
                        <i className="fas fa-box-open fa-3x mb-3 opacity-50"></i>
                        <p>No chit plans created yet. Start by adding one!</p>
                    </div>
                ) : (
                    <>
                        <Table responsive hover className="mb-0 custom-table">
                            <thead className="bg-light">
                                <tr>
                                    <th>Plan Name</th>
                                    <th>Monthly / Total</th>
                                    <th>Duration</th>
                                    <th>Return Type</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentChits.map(chit => (
                                    <tr key={chit._id}>
                                        <td className="fw-bold">{chit.planName}</td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span>₹{chit.monthlyAmount}/mo</span>
                                                <small className="text-muted">Total: ₹{chit.totalAmount}</small>
                                            </div>
                                        </td>
                                        <td>{chit.durationMonths} Months</td>
                                        <td><span className={`badge ${chit.returnType === 'Gold' ? 'bg-warning text-dark' : 'bg-success text-white'}`}>{chit.returnType || 'Cash'}</span></td>
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
                    </>
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center py-3 border-top bg-white px-3 custom-pagination">
                        <style>
                            {`
                                .custom-pagination .page-link { color: #915200; border: none; margin: 0 4px; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 600; transition: all 0.2s ease; text-decoration: none; }
                                .custom-pagination .page-item.active .page-link { background: linear-gradient(135deg, #915200 0%, #d4af37 100%); color: white; box-shadow: 0 4px 10px rgba(145, 82, 0, 0.2); }
                                .custom-pagination .page-link:hover { background-color: #fffbf0; color: #7a4500; transform: translateY(-2px); }
                                .custom-pagination .page-item.disabled .page-link { background-color: transparent; color: #e9ecef; cursor: not-allowed; }
                            `}
                        </style>
                        <Pagination className="mb-0 align-items-center">
                            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                            {totalPages > 0 && (<Pagination.Item active={1 === currentPage} onClick={() => handlePageChange(1)}>1</Pagination.Item>)}
                            {currentPage > 3 && totalPages > 5 && <Pagination.Ellipsis disabled />}
                            {(() => {
                                const pages = [];
                                let start = Math.max(2, currentPage - 1);
                                let end = Math.min(totalPages - 1, currentPage + 1);
                                if (totalPages > 5) {
                                    if (currentPage <= 3) { end = 4; start = 2; }
                                    if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
                                } else { start = 2; end = totalPages - 1; }
                                for (let number = start; number <= end; number++) {
                                    if (number > 1 && number < totalPages) {
                                        pages.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>{number}</Pagination.Item>);
                                    }
                                }
                                return pages;
                            })()}
                            {currentPage < totalPages - 2 && totalPages > 5 && <Pagination.Ellipsis disabled />}
                            {totalPages > 1 && (<Pagination.Item active={totalPages === currentPage} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>)}
                            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    </div>
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
                                    <div className="mt-2 p-2 bg-light rounded text-center">
                                        <small className="text-muted d-block">Monthly Installment (Approx)</small>
                                        <strong style={{ color: '#915200', fontSize: '1.2rem' }}>₹{calculatedMonthly}</strong>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#915200' }}>Duration (Months)</Form.Label>
                            <Form.Range name="duration" min="3" max="60" value={duration} onChange={(e) => setDuration(e.target.value)} />
                            <div className="text-center fw-bold" style={{ color: '#915200' }}>{duration} Months</div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#915200' }} className="d-block mb-2">Return Type</Form.Label>
                            <div className="d-flex gap-4">
                                <Form.Check type="radio" id="returnType-cash" name="returnType" value="Cash" label="Cash" checked={returnType === 'Cash'} onChange={(e) => setReturnType(e.target.value)} className="fw-bold text-secondary" />
                                <Form.Check type="radio" id="returnType-gold" name="returnType" value="Gold" label="Gold" checked={returnType === 'Gold'} onChange={(e) => setReturnType(e.target.value)} className="fw-bold text-warning" />
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label style={{ color: '#915200' }}>Description / Benefits</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" defaultValue={currentChit?.description} placeholder="Describe the benefits..." />
                        </Form.Group>
                        <Button style={{ background: 'linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)', borderColor: '#915200', color: '#915200' }} type="submit" className="w-100 rounded-pill fw-bold">
                            Save Plan
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Upgrade Modal */}
            <Modal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} centered size={!selectedUpgradePlan ? "lg" : "md"}>
                <Modal.Header closeButton className="border-0 bg-warning bg-opacity-10">
                    <Modal.Title className="fw-bold text-warning-emphasis">
                        <i className="fas fa-crown me-2"></i>Upgrade Plan
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {!selectedUpgradePlan ? (
                        // Plan Selection View (For Basic Users)
                        <div>
                            <div className="d-flex justify-content-center gap-2 mb-4">
                                <Button
                                    variant={upgradeCycle === 'monthly' ? 'dark' : 'outline-dark'}
                                    size="sm"
                                    className="rounded-pill px-4 fw-bold"
                                    onClick={() => setUpgradeCycle('monthly')}
                                >
                                    Monthly
                                </Button>
                                <Button
                                    variant={upgradeCycle === 'yearly' ? 'dark' : 'outline-dark'}
                                    size="sm"
                                    className="rounded-pill px-4 fw-bold"
                                    onClick={() => setUpgradeCycle('yearly')}
                                >
                                    Yearly <Badge bg="success" className="ms-1">-17%</Badge>
                                </Button>
                            </div>
                            <Row className="g-4">
                                {['Standard', 'Premium'].map((planKey) => {
                                    const detail = PRICING[planKey];
                                    const price = upgradeCycle === 'yearly' ? detail.yearly : detail.monthly;
                                    return (
                                        <Col md={6} key={planKey}>
                                            <Card className={`h-100 shadow-sm border-${planKey === 'Premium' ? 'warning' : 'secondary'} border-2`}>
                                                <Card.Body className="text-center d-flex flex-column p-4">
                                                    <h4 className="fw-bold mb-2" style={{ color: planKey === 'Premium' ? '#d4af37' : '#6c757d' }}>{planKey}</h4>
                                                    <div className="mb-3">
                                                        <span className="display-6 fw-bold">₹{price.toLocaleString()}</span>
                                                        <span className="text-muted fs-6">/{upgradeCycle === 'yearly' ? 'yr' : 'mo'}</span>
                                                    </div>

                                                    <div className="flex-grow-1">
                                                        <ul className="list-unstyled text-start small mb-4 mx-auto" style={{ maxWidth: '250px' }}>
                                                            {detail.benefits.map((b, i) => (
                                                                <li key={i} className="mb-2 text-muted"><i className={`fas fa-check-circle me-2 text-${planKey === 'Premium' ? 'success' : 'primary'}`}></i>{b}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="mt-auto">
                                                        <Button
                                                            variant={planKey === 'Premium' ? 'warning' : 'outline-dark'}
                                                            className="w-100 rounded-pill mt-2 fw-bold"
                                                            onClick={() => setSelectedUpgradePlan(planKey)}
                                                        >
                                                            Select {planKey}
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>
                    ) : (
                        // Selected Plan Payment View
                        <div className="text-center">
                            {userPlan === 'Basic' && (
                                <div className="text-start mb-2">
                                    <Button variant="link" className="text-muted p-0 text-decoration-none" onClick={() => setSelectedUpgradePlan(null)}>
                                        <i className="fas fa-arrow-left me-1"></i> Back to Plans
                                    </Button>
                                </div>
                            )}
                            <img src="/images/AURUM.png" alt="Logo" className="mb-3" style={{ height: '60px' }} />
                            <h4 className="fw-bold" style={{ color: '#915200' }}>{selectedUpgradePlan} Plan</h4>
                            <p className="text-muted small">Unlock higher limits and exclusive features!</p>

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
                                    Yearly (Save ~15%)
                                </Button>
                            </div>

                            <div className="display-6 fw-bold text-success">
                                ₹{PRICING[selectedUpgradePlan]?.[upgradeCycle].toLocaleString()}
                                <span className="fs-6 text-muted">/{upgradeCycle === 'yearly' ? 'year' : 'month'} <span className="text-danger small">(Incl. 18% GST)</span></span>
                            </div>

                            <div className="mt-4">
                                <Button variant="dark" className="px-5 rounded-pill fw-bold w-100 py-3" onClick={processUpgradePayment}>
                                    Pay & Upgrade to {selectedUpgradePlan}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
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
            <Modal show={alertState.show} onHide={() => setAlertState(prev => ({ ...prev, show: false }))} centered className="fade" contentClassName="border-0 rounded-4 overflow-hidden shadow-lg">
                <div className="p-0 position-relative">
                    <div className="text-center p-4 pt-5">
                        <div className={`mb-4 mx-auto rounded-circle d-flex align-items-center justify-content-center shadow-sm`} style={{ width: '80px', height: '80px', background: alertState.variant === 'success' ? '#d1e7dd' : alertState.variant === 'danger' ? '#f8d7da' : '#FFF3CD' }}>
                            <i className={`fas ${alertState.variant === 'success' ? 'fa-check' : alertState.variant === 'danger' ? 'fa-exclamation-triangle' : 'fa-info'} fa-3x`} style={{ color: alertState.variant === 'success' ? '#198754' : alertState.variant === 'danger' ? '#dc3545' : '#856404' }}></i>
                        </div>
                        <h4 className="fw-bold mb-2" style={{ color: '#915200' }}>{alertState.title}</h4>
                        <p className="text-muted fw-semibold px-4 mb-4">{alertState.message}</p>
                        <button className="btn fw-bold rounded-pill px-5 py-2 text-white shadow-sm" style={{ background: 'linear-gradient(90deg, #915200 0%, #a86400 100%)', border: 'none', transition: 'transform 0.2s' }} onClick={() => setAlertState(prev => ({ ...prev, show: false }))} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                            Okay, Got it
                        </button>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)' }}></div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <Modal show={confirmState.show} onHide={() => setConfirmState(prev => ({ ...prev, show: false }))} centered contentClassName="border-0 rounded-4 overflow-hidden shadow-lg">
                <div className="p-4 pt-5 text-center">
                    <div className="mb-4 mx-auto rounded-circle d-flex align-items-center justify-content-center bg-danger bg-opacity-10" style={{ width: '80px', height: '80px' }}>
                        <i className="fas fa-trash-alt fa-3x text-danger"></i>
                    </div>
                    <h4 className="fw-bold mb-2" style={{ color: '#915200' }}>Are you sure?</h4>
                    <p className="text-muted fw-semibold px-4 mb-4">{confirmState.message}</p>
                    <div className="d-flex gap-3 justify-content-center mb-2">
                        <Button variant="light" className="rounded-pill px-4 fw-bold text-muted" onClick={() => setConfirmState(prev => ({ ...prev, show: false }))}>Cancel</Button>
                        <Button variant="danger" className="rounded-pill px-4 fw-bold" onClick={confirmState.onConfirm}>Yes, Delete It</Button>
                    </div>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, #dc3545 0%, #f8d7da 100%)' }}></div>
            </Modal>
        </div>
    );
};

export default ManageChits;
