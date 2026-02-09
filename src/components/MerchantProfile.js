/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Form, Button, Row, Col, Card, Spinner, Badge, Modal } from 'react-bootstrap';

import axios from 'axios';
import { APIURL } from '../utils/Function';

import { useRazorpay } from "react-razorpay";

const MerchantProfile = ({ merchantData }) => {
    const { Razorpay } = useRazorpay();
    const [data, setData] = useState(merchantData || {});
    const [isEditing, setIsEditing] = useState(false);
    const [merchantUpgradeCycle, setMerchantUpgradeCycle] = useState('yearly');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

    // Verification States
    // Derived states

    // Sync with prop when it changes
    useEffect(() => {
        if (merchantData) {
            setData(merchantData);
        }
    }, [merchantData]);


    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'panNumber' || e.target.name === 'gstin') {
            value = value.toUpperCase();
        }
        setData({ ...data, [e.target.name]: value });
    };

    const handleBankChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'ifscCode') {
            value = value.toUpperCase();
        }
        setData({
            ...data,
            bankDetails: {
                ...data.bankDetails,
                [e.target.name]: value
            }
        });
    };




    const uploadAddressProofHandler = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user?.token}` } };
            const { data: imagePath } = await axios.post(`${APIURL}/upload`, formData, config);

            setData(prev => ({
                ...prev,
                addressProof: imagePath
            }));
        } catch (error) {
            console.error(error);
            showAlert('Address Proof upload failed', "danger", "Upload Error");
        }
    };

    const removeAddressProofHandler = () => {
        setData(prev => ({
            ...prev,
            addressProof: ''
        }));
    };

    const uploadShopLogoHandler = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user?.token}` } };
            const { data: imagePath } = await axios.post(`${APIURL}/upload`, formData, config);

            setData(prev => ({
                ...prev,
                shopLogo: imagePath
            }));
            showAlert("Shop Logo uploaded successfully", "success", "Success");
        } catch (error) {
            console.error(error);
            showAlert('Shop Logo upload failed', "danger", "Upload Error");
        }
    };

    const removeShopLogoHandler = () => {
        setData(prev => ({
            ...prev,
            shopLogo: ''
        }));
    };

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user?.token}`
                },
            };

            const { data: imagePath } = await axios.post(`${APIURL}/upload`, formData, config);

            const currentImages = data.shopImages || [];
            setData({ ...data, shopImages: [...currentImages, imagePath] });
        } catch (error) {
            console.error(error);
            showAlert("Image upload failed", "danger", "Upload Error");
        }
    };



    const maskAccountNumber = (value = '') =>
        value.length > 4 ? 'XXXXXX' + value.slice(-4) : value;

    const maskIFSC = (value = '') =>
        value ? 'XXXXXXXX' : '';


    const handleSave = async (e) => {
        if (e) e.preventDefault();

        // PAN Validation
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (data.panNumber && !panRegex.test(data.panNumber.toUpperCase())) {
            showAlert("Invalid PAN Format. Example: ABCDE1234F", "warning", "Validation Error");
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = {
                headers: {
                    Authorization: `Bearer ${user?.token}`
                }
            };
            const { data: updatedMerchant } = await axios.put(`${APIURL}/merchants/${data._id}`, data, config);
            console.log(updatedMerchant);

            setData(updatedMerchant); // Update state immediately

            // Update localStorage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) {
                const updatedUser = { ...storedUser, ...updatedMerchant };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            showAlert("Profile Updated Successfully!", "success", "Success");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            showAlert("Failed to update profile.", "danger", "Error");
        }
    };

    // State for Downgrade Logic
    const [myChits, setMyChits] = useState([]);
    const [loadingChits, setLoadingChits] = useState(false);
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const standardLimit = 3;

    const handleUpgradePayment = async () => {
        try {
            // 1. Create Order
            const amount = merchantUpgradeCycle === 'yearly' ? 41300 : 4130; // 35000 + 18% GST
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: amount // Premium Plan Price
            });

            // 2. Initialize Razorpay
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_S6RoMCiZCpsLo7", // Correct key matching backend
                amount: order.amount,
                currency: order.currency,
                name: "Aurum Jewellery",
                description: "Upgrade to Premium Plan",
                order_id: order.id,
                handler: async function (response) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await axios.post(`${APIURL}/payments/verify-subscription-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.status === 'success') {
                            // 4. Update Profile to Premium
                            await upgradeToPremium(response.razorpay_payment_id);
                        } else {
                            showAlert("Payment verification failed", "danger", "Payment Error");
                        }
                    } catch (err) {
                        console.error(err);
                        showAlert("Payment verification failed", "danger", "Payment Error");
                    }
                },
                prefill: {
                    name: data.name,
                    email: data.email,
                    contact: data.phone
                },
                theme: {
                    color: "#915200"
                }
            };

            const rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                showAlert(response.error.description, "danger", "Payment Failed");
            });

            // Safety Delay before opening Razorpay (same as mobile app)
            setTimeout(() => {
                rzp1.open();
            }, 2000);

        } catch (error) {
            console.error(error);
            showAlert("Order creation failed", "danger", "Error");
        }
    };

    const upgradeToPremium = async (paymentId) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };

            // Update plan to Premium
            const updatePayload = { ...data, plan: 'Premium', billingCycle: merchantUpgradeCycle, paymentId };
            const { data: updatedMerchant } = await axios.put(`${APIURL}/merchants/${data._id}`, updatePayload, config);
            console.log(updatedMerchant);

            setData(updatedMerchant);
            showAlert("Payment Successful! Upgraded to Premium Plan.", "success", "Upgrade Successful");
            setShowUpgradeModal(false);

            // Optionally update localStorage user if it stores plan
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) {
                storedUser.plan = 'Premium';
                localStorage.setItem('user', JSON.stringify(storedUser));
            }
        } catch (error) {
            console.error(error);
            showAlert("Upgrade Failed", "danger", "Error");
        }
    };

    // --- Downgrade Logic ---
    const fetchChits = async () => {
        setLoadingChits(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };
            const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${merchantData._id}?limit=100`, config);
            setMyChits(data.plans || []);
        } catch (error) {
            console.error("Error fetching chits", error);
        } finally {
            setLoadingChits(false);
        }
    };

    const handleDowngradeInitiate = () => {
        fetchChits();
        setShowDowngradeModal(true);
    };

    const handleDeleteChit = async (id) => {
        if (window.confirm("Are you sure you want to delete this plan? This cannot be undone.")) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const config = { headers: { Authorization: `Bearer ${user?.token}` } };
                await axios.delete(`${APIURL}/chit-plans/${id}`, config);
                // Update local list
                setMyChits(prev => prev.filter(c => c._id !== id));
            } catch (error) {
                console.error("Error deleting chit plan", error);
                showAlert("Failed to delete plan.", "danger", "Error");
            }
        }
    };

    const processDowngrade = async () => {
        try {
            // Initiate standard payment logic (1770 INR = 1500 + 18%)
            const { data: order } = await axios.post(`${APIURL}/merchants/create-renewal-order`, {
                plan: 'Standard'
            }); // Note: Using existing renewal endpoint to create order for Standard

            const user = JSON.parse(localStorage.getItem('user'));

            const options = {
                key: order.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_S6RoMCiZCpsLo7", // keyId might come from create-renewal-order response
                amount: order.order.amount,
                currency: order.order.currency,
                name: "Aurum Jewellery",
                description: "Downgrade to Standard Plan",
                order_id: order.order.id,
                handler: async function (response) {
                    try {
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: 'Standard'
                        };
                        const config = { headers: { Authorization: `Bearer ${user?.token}` } };
                        const { data: verifyData } = await axios.post(`${APIURL}/merchants/verify-renewal`, verifyPayload, config);

                        if (verifyData.success) {
                            setData(verifyData.merchant);
                            // Update Local Storage
                            const storedUser = JSON.parse(localStorage.getItem('user'));
                            if (storedUser) {
                                const updated = { ...storedUser, ...verifyData.merchant };
                                localStorage.setItem('user', JSON.stringify(updated));
                            }
                            showAlert("Plan Downgraded to Standard Successfully!", "success", "Downgrade Successful");
                            setShowDowngradeModal(false);
                        }
                    } catch (err) {
                        console.error(err);
                        showAlert("Downgrade payment verification failed", "danger", "Payment Error");
                    }
                },
                prefill: {
                    name: data.name,
                    email: data.email,
                    contact: data.phone
                },
                theme: { color: "#915200" }
            };

            const rzp1 = new Razorpay(options);

            // Safety Delay before opening Razorpay
            setTimeout(() => {
                rzp1.open();
            }, 2000);

        } catch (error) {
            console.error("Downgrade Error", error);
            showAlert("Failed to initiate downgrade payment.", "danger", "Error");
        }
    };

    // Calculate current count dynamically if modal is open
    const currentChitCount = showDowngradeModal ? myChits.length : 0;

    console.log(data);


    if (!data || !data._id) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" variant="warning" />
            </div>
        );
    }

    return (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
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
            <div className="p-4 bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #ebdc87 0%, #e2d183 100%)' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0 fw-bold" style={{ color: '#915200' }}><i className="fas fa-user-circle me-2"></i>MERCHANT PROFILE</h4>
                    <div className="d-flex gap-2">
                        {isEditing && (
                            <Button
                                variant="light"
                                size="sm"
                                className='fw-bold'
                                style={{ borderColor: '#915200', color: '#915200', background: 'linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)' }}

                                onClick={() => setIsEditing(false)}
                            >
                                <i className="fas fa-times me-1"></i> Cancel
                            </Button>
                        )}
                        <Button
                            variant={isEditing ? "light" : "outline-light"}
                            size="sm"
                            className='fw-bold'
                            style={{ borderColor: '#915200', color: '#e2d183', backgroundColor: '#915200' }}

                            onClick={() => isEditing ? document.getElementById('profile-form').requestSubmit() : setIsEditing(true)}
                        >
                            {isEditing ? <><i className="fas fa-save me-1"></i> Save Changes</> : <><i className="fas fa-edit me-1"></i> Edit Profile</>}
                        </Button>
                    </div>
                </div>
            </div>
            <Card.Body className="p-0">
                <Form id="profile-form" onSubmit={handleSave}>
                    <div className="p-4 border-bottom bg-light">
                        <Row className="align-items-center">
                            <Col md={3} className="text-center mb-3 mb-md-0">
                                <div className="position-relative d-inline-block">
                                    <div
                                        className="rounded-circle overflow-hidden shadow-sm border"
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            backgroundColor: '#f8f9fa',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {data.shopLogo ? (
                                            <img
                                                src={`${APIURL.replace('/api', '')}${data.shopLogo}`}
                                                alt="Shop Logo"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <i className="fas fa-store fa-3x" style={{ color: '#e2d183' }}></i>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="position-absolute bottom-0 end-0">
                                            {data.shopLogo ? (
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px' }}
                                                    onClick={removeShopLogoHandler}
                                                >
                                                    <i className="fas fa-trash-alt small"></i>
                                                </Button>
                                            ) : (
                                                <label
                                                    className="btn btn-warning btn-sm rounded-circle shadow-sm m-0 p-0 d-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px', backgroundColor: '#e2d183', borderColor: '#e2d183' }}
                                                >
                                                    <i className="fas fa-camera small text-dark"></i>
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={uploadShopLogoHandler}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 small fw-bold text-uppercase" style={{ color: '#915200' }}>Shop Logo</div>
                            </Col>
                            <Col md={9}>
                                <div className="ps-md-4">
                                    <h3 className="fw-bold mb-1" style={{ color: '#915200' }}>{data.name}</h3>
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill shadow-sm">
                                            <i className="fas fa-crown me-1"></i> {data.plan || 'Standard'} Plan
                                        </Badge>
                                        <Badge bg={data.status === 'Approved' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill shadow-sm">
                                            {data.status}
                                        </Badge>
                                    </div>
                                    <Row className="g-3">
                                        <Col sm={6}>
                                            <div className="d-flex align-items-center gap-2 text-muted small">
                                                <i className="fas fa-envelope text-warning"></i>
                                                <span className="fw-semibold">{data.email}</span>
                                            </div>
                                        </Col>
                                        <Col sm={6}>
                                            <div className="d-flex align-items-center gap-2 text-muted small">
                                                <i className="fas fa-phone text-warning"></i>
                                                <span className="fw-semibold">{data.phone}</span>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <div className="p-4 px-md-5">
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>Business Name</Form.Label>
                                    <Form.Control
                                        name="name"
                                        value={data.name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`rounded-3 ${!isEditing ? "" : "bg-white shadow-sm"} fw-bold`}
                                        style={{
                                            transition: 'all 0.3s ease',
                                            border: isEditing ? '1px solid #915200' : '1px solid transparent',
                                            // color: '#915200'
                                        }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>Email Address</Form.Label>
                                    <Form.Control
                                        name="email"
                                        value={data.email}
                                        onChange={handleChange}
                                        disabled={true} /* Email usually immutable */
                                        className="fw-bold"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>Contact Phone</Form.Label>
                                    <Form.Control
                                        name="phone"
                                        value={data.phone}
                                        onChange={handleChange}
                                        disabled
                                        className='fw-bold'
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>Business Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="address"
                                        value={data.address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`rounded-3 ${!isEditing ? "" : "bg-white shadow-sm"} fw-bold`}
                                        style={{
                                            transition: 'all 0.3s ease',
                                            border: isEditing ? '1px solid #915200' : '1px solid transparent',
                                            // color: '#915200'
                                        }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <div className="d-flex align-items-center my-3">
                                    <div style={{ height: '1px', flex: 1, backgroundColor: '#e2d183' }}></div>
                                    <span className="mx-3 small fw-bold uppercase" style={{ color: '#915200', letterSpacing: '1px' }}>
                                        Bank Details (Payouts)
                                    </span>
                                    <div style={{ height: '1px', flex: 1, backgroundColor: '#e2d183' }}></div>
                                </div>
                            </Col>
                            {/* Payout Details Section */}
                            <Col md={12}>
                                <Card className="border-0 bg-light p-3">
                                    <Row className="g-2">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>Account Holder Name</Form.Label>
                                                <Form.Control
                                                    name="accountHolderName" // Changed from accountName to accountHolderName to match schema
                                                    value={data.bankDetails?.accountHolderName || ''}
                                                    onChange={handleBankChange}
                                                    disabled={!isEditing}
                                                    placeholder='Enter Account Holder Name'
                                                    // size="sm"
                                                    className="fw-bold"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label
                                                    className="small fw-bold text-uppercase"
                                                    style={{ color: '#915200' }}
                                                >
                                                    Account Number
                                                </Form.Label>

                                                <Form.Control
                                                    name="accountNumber"
                                                    value={
                                                        isEditing
                                                            ? data.bankDetails?.accountNumber || ''
                                                            : maskAccountNumber(data.bankDetails?.accountNumber)
                                                    }
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, ''); // digits only

                                                        handleBankChange({
                                                            target: {
                                                                name: 'accountNumber',
                                                                value
                                                            }
                                                        });
                                                    }}
                                                    disabled={!isEditing}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    placeholder="Enter account number"
                                                    className="fw-bold"
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>IFSC Code</Form.Label>
                                                <Form.Control
                                                    name="ifscCode"
                                                    value={isEditing ? data.bankDetails?.ifscCode || '' : maskIFSC(data.bankDetails?.ifscCode)}
                                                    onChange={handleBankChange}
                                                    disabled={!isEditing}
                                                    placeholder='Enter IFSC code'
                                                    // size="sm"
                                                    className="fw-bold"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2} className="d-flex align-items-end">
                                            {/* No verification needed */}
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                            {/* PAN Details Section - New */}
                            <Col md={12}>
                                <div className="d-flex align-items-center my-3">
                                    <div style={{ height: '1px', flex: 1, backgroundColor: '#e2d183' }}></div>
                                    <span className="mx-3 small fw-bold uppercase" style={{ color: '#915200', letterSpacing: '1px' }}>
                                        Business Details
                                    </span>
                                    <div style={{ height: '1px', flex: 1, backgroundColor: '#e2d183' }}></div>
                                </div>
                            </Col>
                            <Col md={12}>
                                <Card className="border-0 bg-light p-3">
                                    <Row className="g-2">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label
                                                    className="small fw-bold text-uppercase"
                                                    style={{ color: '#915200' }}
                                                >
                                                    GSTIN Number
                                                </Form.Label>
                                                <Form.Control
                                                    name="gstin"
                                                    value={data.gstin || ''}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    placeholder="Enter GSTIN"
                                                    className="fw-bold"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label
                                                    className="small fw-bold text-uppercase"
                                                    style={{ color: '#915200' }}
                                                >
                                                    Full legal name (as per PAN)
                                                </Form.Label>
                                                <Form.Control
                                                    name="legalName"
                                                    value={data.legalName || ''}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    placeholder="Enter Legal Name"
                                                    className="fw-bold"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label
                                                    className="small fw-bold text-uppercase"
                                                    style={{ color: '#915200' }}
                                                >
                                                    PAN number (Individual or Business)
                                                </Form.Label>
                                                <Form.Control
                                                    name="panNumber"
                                                    value={data.panNumber || ''}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    placeholder="Enter PAN Number"
                                                    className="fw-bold"
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                {/* Label */}
                                                <Form.Label
                                                    className="small fw-bold text-uppercase"
                                                    style={{ color: '#915200' }}
                                                >
                                                    Address Proof
                                                </Form.Label>

                                                {/* Image / Upload Section */}
                                                <div className="mt-2">
                                                    {data.addressProof ? (
                                                        <div className="position-relative d-inline-block">
                                                            <img
                                                                src={`${APIURL.replace('/api', '')}${data.addressProof}`}
                                                                alt="Address Proof"
                                                                className="img-fluid rounded border shadow-sm"
                                                                style={{ height: '120px', objectFit: 'cover' }}
                                                            />

                                                            {isEditing && (
                                                                <Button
                                                                    type="button"
                                                                    variant="danger"
                                                                    size="sm"
                                                                    className="position-absolute top-0 end-0 rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        padding: 0,
                                                                        transform: 'translate(50%, -50%)',
                                                                        border: '2px solid white'
                                                                    }}
                                                                    onClick={removeAddressProofHandler}
                                                                    title="Remove Address Proof"
                                                                >
                                                                    <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* NO IMAGE STATE */}
                                                            <div
                                                                className="small text-muted fw-semibold mb-2"
                                                                style={{ fontStyle: 'italic' }}
                                                            >
                                                                No Address Proof uploaded
                                                            </div>

                                                            {/* UPLOAD ONLY IN EDIT MODE */}
                                                            {isEditing && (
                                                                <Form.Control
                                                                    type="file"
                                                                    size="sm"
                                                                    accept="image/*"
                                                                    onChange={uploadAddressProofHandler}
                                                                    className="fw-bold"
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                            </Form.Group>
                                        </Col>

                                    </Row>
                                </Card>
                            </Col>

                            <Col md={12}>
                                <h6 className="mt-3 fw-bold" style={{ color: '#915200' }}>Shop Images</h6>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    {data.shopImages && data.shopImages.length > 0 ? (
                                        data.shopImages.map((img, idx) => (
                                            <div key={idx} className="position-relative">
                                                <img
                                                    src={`${APIURL.replace('/api', '')}${img}`}
                                                    alt="Shop"
                                                    style={{
                                                        width: 100,
                                                        height: 100,
                                                        objectFit: 'cover',
                                                        borderRadius: 8,
                                                        border: '1px solid #ddd'
                                                    }}
                                                />

                                                {isEditing && (
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        size="sm"
                                                        className="position-absolute top-0 end-0 rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                                        style={{
                                                            width: '24px',
                                                            height: '24px',
                                                            padding: 0,
                                                            transform: 'translate(50%, -50%)',
                                                            border: '2px solid white'
                                                        }}
                                                        onClick={() => {
                                                            const newImages = data.shopImages.filter((_, i) => i !== idx);
                                                            setData({ ...data, shopImages: newImages });
                                                        }}
                                                    >
                                                        <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                                                    </Button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            className="small text-muted fw-semibold"
                                            style={{ fontStyle: 'italic' }}
                                        >
                                            No shop images uploaded yet
                                        </div>
                                    )}
                                </div>

                                {isEditing && (
                                    <>
                                        {data.plan !== 'Basic' ? (
                                            <Form.Control
                                                type="file"
                                                onChange={uploadFileHandler}
                                                accept="image/*"
                                            />
                                        ) : (
                                            <div
                                                className="p-4 rounded-3 text-center position-relative overflow-hidden"
                                                style={{
                                                    border: '2px dashed #e2d183',
                                                    background: 'linear-gradient(135deg, rgba(255,249,196,0.3) 0%, rgba(255,255,255,0.4) 100%)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onClick={() => setShowUpgradeModal(true)}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,249,196,0.5)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,249,196,0.3) 0%, rgba(255,255,255,0.4) 100%)'}
                                            >
                                                <div className="position-relative z-1">
                                                    <div className="mb-2">
                                                        <span className="badge bg-warning text-dark fw-bold shadow-sm px-3 py-2" style={{ letterSpacing: '0.5px' }}>
                                                            <i className="fas fa-crown me-1 text-danger"></i> PREMIUM FEATURE
                                                        </span>
                                                    </div>
                                                    <div className="mb-3 position-relative d-inline-block">
                                                        <i className="fas fa-store fa-3x" style={{ color: '#e2d183' }}></i>
                                                        <div className="position-absolute bottom-0 end-0 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '24px', height: '24px' }}>
                                                            <i className="fas fa-lock small text-danger"></i>
                                                        </div>
                                                    </div>

                                                    <h6 className="fw-bold mb-2" style={{ color: '#915200' }}>Shop Gallery is Locked</h6>
                                                    <p className="small text-muted mb-3 mx-auto" style={{ maxWidth: '250px' }}>
                                                        Upgrade your plan to upload and showcase your shop interior & exterior images to build trust.
                                                    </p>

                                                    <Button
                                                        size="sm"
                                                        className="rounded-pill fw-bold px-4 text-white"
                                                        style={{
                                                            background: 'linear-gradient(90deg, #915200 0%, #a86400 100%)',
                                                            border: 'none',
                                                            boxShadow: '0 4px 10px rgba(145, 82, 0, 0.3)'
                                                        }}
                                                    >
                                                        Upgrade to Premium
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Col>

                            <Col md={12}>
                                <div
                                    className="p-4 rounded-4 mt-3 d-flex justify-content-between align-items-center position-relative overflow-hidden"
                                    style={{
                                        background: data.plan === 'Premium'
                                            ? 'linear-gradient(135deg, #FFF9C4 0%, #FFF 100%)'
                                            : '#f8f9fa',
                                        border: `1px solid ${data.plan === 'Premium' ? '#e2d183' : '#dee2e6'}`,
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div className="position-relative" style={{ zIndex: 1 }}>
                                        <small className="d-block uppercase fw-bold mb-1" style={{ color: '#915200', letterSpacing: '1px' }}>
                                            Current Plan Status
                                        </small>
                                        <div className="d-flex align-items-center">
                                            <span className="display-6 fw-bold mb-0" style={{ color: '#915200' }}>
                                                {data.plan || 'Standard'}
                                            </span>
                                            {data.plan === 'Premium' && (
                                                <div className="ms-3 px-3 py-1 rounded-pill bg-warning bg-opacity-25 text-warning-emphasis fw-bold small border border-warning">
                                                    <i className="fas fa-crown me-1"></i> Active
                                                </div>
                                            )}
                                        </div>
                                        <div className="small text-muted mt-2">
                                            <i className="fas fa-calendar-alt me-1"></i>
                                            <span className="fw-bold text-capitalize">{data.billingCycle || 'Monthly'}</span> Plan
                                            {data.subscriptionExpiryDate && (
                                                <span className="ms-2">
                                                    • Expires: {new Date(data.subscriptionExpiryDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {data.upcomingPlan && (
                                                <div className="text-info mt-1 fw-bold">
                                                    <i className="fas fa-info-circle me-1"></i>
                                                    {data.plan} active until expiry, then {data.upcomingPlan}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        {/* {data.plan === 'Premium' && (
                                        <Button
                                            variant="outline-secondary"
                                            className="fw-bold rounded-pill px-3"
                                            onClick={handleDowngradeInitiate}
                                        >
                                            <i className="fas fa-arrow-down me-2"></i> Downgrade
                                        </Button>
                                    )} */}
                                        {data.plan !== 'Premium' && (
                                            <Button
                                                onClick={() => setShowUpgradeModal(true)}
                                                size="lg"
                                                className="fw-bold text-white px-4 rounded-pill d-flex align-items-center gap-2 position-relative overflow-hidden"
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
                                                    border: '1px solid rgba(145, 82, 0, 0.65)',
                                                    boxShadow: `
            0 10px 28px rgba(145, 82, 0, 0.45),
            inset 0 1px 1px rgba(255,255,255,0.35),
            inset 0 -2px 6px rgba(0,0,0,0.25)
        `,
                                                    transition: 'transform 0.25s ease',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                                            >
                                                {/* 🔁 Animated Glass Shine */}
                                                <span
                                                    ref={(el) => {
                                                        if (!el || el.dataset.animating) return;
                                                        el.dataset.animating = 'true';

                                                        setInterval(() => {
                                                            el.style.transition = 'none';
                                                            el.style.left = '-70%';

                                                            requestAnimationFrame(() => {
                                                                el.style.transition = 'left 0.55s ease-out';
                                                                el.style.left = '120%';
                                                            });
                                                        }, 3000); // 🔥 shine every 600ms
                                                    }}
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
                                                    }}
                                                />

                                                <i className="fas fa-crown"></i>
                                                Upgrade to Premium
                                                <i className="fas fa-arrow-right ms-1"></i>
                                            </Button>

                                        )}
                                    </div>

                                    {/* Background Watermark Icon */}
                                    <i
                                        className={`fas ${data.plan === 'Premium' ? 'fa-gem' : 'fa-certificate'} position-absolute`}
                                        style={{
                                            right: '-20px',
                                            bottom: '-20px',
                                            fontSize: '10rem',
                                            opacity: 0.1,
                                            color: '#915200',
                                            zIndex: 0
                                        }}
                                    ></i>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Form>
            </Card.Body>

            {/* Upgrade Modal */}
            <div className={`modal fade ${showUpgradeModal ? 'show d-block' : ''}`} style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg">
                        <div className="modal-header border-0 bg-warning bg-opacity-10">
                            <h5 className="modal-title fw-bold text-warning-emphasis"><i className="fas fa-crown me-2"></i>Upgrade to Premium</h5>
                            <button type="button" className="btn-close" onClick={() => setShowUpgradeModal(false)}></button>
                        </div>
                        <div className="modal-body text-center p-4">
                            <div className="mb-3">
                                <img src="/images/AURUM.png" alt="Logo" className="mb-3" style={{ height: '60px' }} />
                                <h3 className="fw-bold">Premium Benefits</h3>
                                <ul className="list-unstyled text-start mx-auto mt-3" style={{ maxWidth: '300px' }}>
                                    <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>iOS App Access</li>
                                    <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>9 Chit Plan</li>
                                    <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Custom Ads</li>
                                    <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Payment Filter (Date)</li>
                                    <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Priority Support</li>
                                </ul>
                                <hr />
                                <div className="d-flex justify-content-center gap-2 mb-3 mt-4">
                                    <Button
                                        variant={merchantUpgradeCycle === 'monthly' ? 'warning' : 'outline-secondary'}
                                        size="sm"
                                        className="fw-bold rounded-pill"
                                        onClick={() => setMerchantUpgradeCycle('monthly')}
                                    >
                                        Monthly
                                    </Button>
                                    <Button
                                        variant={merchantUpgradeCycle === 'yearly' ? 'warning' : 'outline-secondary'}
                                        size="sm"
                                        className="fw-bold rounded-pill"
                                        onClick={() => setMerchantUpgradeCycle('yearly')}
                                    >
                                        Yearly (Save ₹7,000)
                                    </Button>
                                </div>
                                <div className="display-6 fw-bold text-success">
                                    {merchantUpgradeCycle === 'yearly' ? '₹41,300' : '₹4,130'}
                                    <span className="fs-6 text-muted">/{merchantUpgradeCycle === 'yearly' ? 'year' : 'month'} <span className="text-danger small">(Incl. 18% GST)</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-0 justify-content-center pb-4">
                            <Button variant="dark" className="px-5 rounded-pill fw-bold" onClick={handleUpgradePayment}>
                                Pay & Upgrade
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Downgrade Management Modal */}
            <div className={`modal fade ${showDowngradeModal ? 'show d-block' : ''}`} style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header border-0 pt-4 px-4 bg-light">
                            <div>
                                <h4 className="fw-bold text-danger mb-0"><i className="fas fa-exclamation-triangle me-2"></i>Downgrade Action Required</h4>
                                <p className="text-muted mt-2 mb-0">
                                    You are initiating a downgrade to <strong>Standard Plan</strong> (Max 3 Chits).
                                </p>
                            </div>
                            <button type="button" className="btn-close" onClick={() => setShowDowngradeModal(false)}></button>
                        </div>
                        <div className="modal-body px-4 py-4">
                            {/* Validation Status */}
                            {currentChitCount > standardLimit ? (
                                <div className="alert alert-warning border-0 d-flex align-items-center mb-4">
                                    <i className="fas fa-info-circle me-3 fa-2x"></i>
                                    <div>
                                        You currently have <strong>{currentChitCount}</strong> active plans.
                                        Please delete <strong>{currentChitCount - standardLimit}</strong> plan(s) to proceed with the downgrade.
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-success border-0 d-flex align-items-center mb-4">
                                    <i className="fas fa-check-circle me-3 fa-2x"></i>
                                    <div>
                                        You are within the limits for the Standard Plan. You can proceed with the downgrade payment.
                                    </div>
                                </div>
                            )}

                            {/* Plan List */}
                            <h6 className="fw-bold text-secondary mb-3">Manage Your Active Plans</h6>
                            {loadingChits ? (
                                <div className="text-center py-5"><div className="spinner-border text-secondary"></div></div>
                            ) : (
                                <div className="list-group list-group-flush border rounded-3 overflow-hidden mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                                    {myChits.length === 0 && <div className="p-3 text-center text-muted">No active plans found.</div>}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer border-0 px-4 pb-4">
                            <Button variant="light" className="px-4 rounded-pill fw-bold" onClick={() => setShowDowngradeModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant={currentChitCount <= standardLimit ? "danger" : "secondary"}
                                className="px-4 rounded-pill fw-bold"
                                disabled={currentChitCount > standardLimit}
                                onClick={processDowngrade}
                            >
                                {currentChitCount <= standardLimit ? 'Pay & Downgrade (₹1,770)' : `Delete ${currentChitCount - standardLimit} More`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default MerchantProfile;
