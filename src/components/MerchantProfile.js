import React, { useEffect, useState } from 'react';
import { Form, Button, Row, Col, Card, Spinner, Badge } from 'react-bootstrap';

import axios from 'axios';
import { APIURL } from '../utils/Function';

import { useRazorpay } from "react-razorpay";

const MerchantProfile = ({ merchantData }) => {
    const { Razorpay } = useRazorpay();
    const [data, setData] = useState(merchantData);
    const [isEditing, setIsEditing] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Verification States
    const [verifyingBank, setVerifyingBank] = useState(false);
    const [verifyingPan, setVerifyingPan] = useState(false);
    const [uploadingPan, setUploadingPan] = useState(false);
    const [nameMismatch, setNameMismatch] = useState(false);

    // Derived states
    const bankVerified = data.bankDetails?.verificationStatus === 'verified';
    const panVerified = data.panDetails?.status === 'verified';

    // Fetch fresh data on mount
    useEffect(() => {
        const fetchFreshData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const config = { headers: { Authorization: `Bearer ${user?.token}` } };
                const data = await axios.get(`${APIURL}/merchants/${merchantData._id}`, config);
                console.log(data.data);
                setData(data.data);
            } catch (e) {
                console.log("Could not fetch fresh data, using props");
            }
        };
        fetchFreshData();
    }, [merchantData._id]);


    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleBankChange = (e) => {
        const { name, value } = e.target;
        // Reset verification on change
        if (['accountNumber', 'ifscCode'].includes(name)) {
            setData(prev => ({
                ...prev,
                bankDetails: {
                    ...prev.bankDetails,
                    [name]: value,
                    verificationStatus: 'pending',
                    verifiedName: ''
                }
            }));
        } else {
            setData({
                ...data,
                bankDetails: {
                    ...data.bankDetails,
                    [e.target.name]: e.target.value
                }
            });
        }
    };

    const handlePanChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({
            ...prev,
            panDetails: {
                ...prev.panDetails,
                [name]: value,
                status: 'unverified',
                verifiedName: ''
            }
        }));
    };

    const verifyBankAccount = async () => {
        const { accountNumber, ifscCode, accountHolderName } = data.bankDetails || {};
        if (!accountNumber || !ifscCode) return alert("Please enter Account Number and IFSC");

        setVerifyingBank(true);
        try {
            const { data: resData } = await axios.post(`${APIURL}/kyc/verify-bank`, { accountNumber, ifscCode, accountHolderName });
            if (resData.status === 'success') {
                setData(prev => ({
                    ...prev,
                    bankDetails: {
                        ...prev.bankDetails,
                        verifiedName: resData.data.verifiedName,
                        bankName: resData.data.bankName,
                        branchName: resData.data.branchName,
                        verificationStatus: 'verified'
                    }
                }));
                // Save immediately? or wait for user to click Save?
                // Better to let user click save, but feedback is immediate.
            } else {
                alert("Bank Verification Failed");
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Bank Verification Failed");
        }
        setVerifyingBank(false);
    };

    const verifyPanDetails = async () => {
        const { panNumber } = data.panDetails || {};
        if (!panNumber) return alert("Please enter PAN Number");

        setVerifyingPan(true);
        try {
            // Pass the bank verified name (or input name) to the mock API to ensure a match
            const nameToMatch = data.bankDetails?.verifiedName || data.bankDetails?.accountHolderName || '';
            const { data: resData } = await axios.post(`${APIURL}/kyc/verify-pan`, { panNumber, name: nameToMatch });

            if (resData.status === 'success') {
                const panVerifiedName = resData.data.verifiedName;
                const bankVerifiedName = data.bankDetails?.verifiedName;

                const isMatch = bankVerifiedName && panVerifiedName.trim().toLowerCase() === bankVerifiedName.trim().toLowerCase();
                setNameMismatch(!isMatch);

                setData(prev => ({
                    ...prev,
                    panDetails: {
                        ...prev.panDetails,
                        verifiedName: panVerifiedName,
                        status: 'verified'
                    }
                }));

                if (!isMatch && bankVerifiedName) {
                    alert(`Warning: Name Mismatch.\nBank: ${bankVerifiedName}\nPAN: ${panVerifiedName}\nManual review will be required.`);
                }
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "PAN Verification Failed");
        }
        setVerifyingPan(false);
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
            alert("Image upload failed");
        }
    };

    const uploadPanImageHandler = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        setUploadingPan(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user?.token}` } };
            const { data: imagePath } = await axios.post(`${APIURL}/upload`, formData, config);

            setData(prev => ({
                ...prev,
                panDetails: { ...prev.panDetails, panImage: imagePath }
            }));
            setUploadingPan(false);
        } catch (error) {
            console.error(error);
            setUploadingPan(false);
            alert('PAN Image upload failed');
        }
    };

    const removePanImageHandler = () => {
        setData(prev => ({
            ...prev,
            panDetails: { ...prev.panDetails, panImage: '' }
        }));
    };

    const maskAccountNumber = (value = '') =>
        value.length > 4 ? 'XXXXXX' + value.slice(-4) : value;

    const maskIFSC = (value = '') =>
        value ? 'XXXXXXXX' : '';


    const handleSave = async (e) => {
        if (e) e.preventDefault();
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
            alert("Profile Updated Successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
        }
    };

    const handleUpgradePayment = async () => {
        try {
            // 1. Create Order
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: 5000 // Premium Plan Price
            });

            // 2. Initialize Razorpay
            const options = {
                key: "rzp_test_S0aFMLxRqwkL8z", // Replace with your actual Razorpay Key ID
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
                            alert("Payment verification failed");
                        }
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed");
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
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            alert("Order creation failed");
        }
    };

    const upgradeToPremium = async (paymentId) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };

            // Update plan to Premium
            const updatePayload = { ...data, plan: 'Premium', paymentId }; // optionally save paymentId
            const { data: updatedMerchant } = await axios.put(`${APIURL}/merchants/${data._id}`, updatePayload, config);
            console.log(updatedMerchant);

            setData(updatedMerchant);
            alert("Payment Successful! Upgraded to Premium Plan.");
            setShowUpgradeModal(false);

            // Optionally update localStorage user if it stores plan
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) {
                storedUser.plan = 'Premium';
                localStorage.setItem('user', JSON.stringify(storedUser));
            }
        } catch (error) {
            console.error(error);
            alert("Upgrade Failed");
        }
    };

    return (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="p-4 bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #ebdc87 0%, #e2d183 100%)' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0 fw-bold" style={{ color: '#915200' }}><i className="fas fa-user-circle me-2"></i>Merchant Profile</h4>
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
            <Card.Body className="p-4">
                <Form id="profile-form" onSubmit={handleSave}>
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
                                    disabled={!isEditing}
                                    className={`rounded-3 ${!isEditing ? "" : "bg-white shadow-sm"} fw-bold`}
                                    style={{
                                        transition: 'all 0.3s ease',
                                        border: isEditing ? '1px solid #915200' : '',
                                        // color: '#915200'
                                    }}
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
                                {data.bankDetails?.verifiedName && (
                                    <div className="mb-3 text-success small fw-bold">
                                        <i className="fas fa-check-circle me-1"></i> Verified Name: {data.bankDetails.verifiedName}
                                        <span className="text-secondary ms-2">({data.bankDetails.bankName || ''} - {data.bankDetails.branchName || ''})</span>
                                    </div>
                                )}
                                <Row className="g-2">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>Account Name</Form.Label>
                                            <Form.Control
                                                name="accountHolderName" // Changed from accountName to accountHolderName to match schema
                                                value={data.bankDetails?.accountHolderName || ''}
                                                onChange={handleBankChange}
                                                disabled={!isEditing}
                                                // size="sm"
                                                className="fw-bold"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>Account Number</Form.Label>
                                            <Form.Control
                                                name="accountNumber"
                                                value={isEditing ? data.bankDetails?.accountNumber || '' : maskAccountNumber(data.bankDetails?.accountNumber)}
                                                onChange={handleBankChange}
                                                disabled={!isEditing}
                                                // size="sm"
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
                                                // size="sm"
                                                className="fw-bold"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2} className="d-flex align-items-end">
                                        {isEditing && (
                                            <Button
                                                variant="light"
                                                // size="sm"
                                                className="w-100 fw-bold"
                                                style={{ borderColor: '#915200', color: '#e2d183', backgroundColor: '#915200' }}
                                                onClick={verifyBankAccount}
                                                disabled={verifyingBank || bankVerified}
                                            >
                                                {verifyingBank ? <Spinner size="sm" animation="border" /> : bankVerified ? "Verified" : "Verify Bank"}
                                            </Button>
                                        )}
                                        {!isEditing && bankVerified && <Badge bg="success" className="mb-2">Verified</Badge>}
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                        {/* PAN Details Section - New */}
                        <Col md={12}>
                            <div className="d-flex align-items-center my-3">
                                <div style={{ height: '1px', flex: 1, backgroundColor: '#e2d183' }}></div>
                                <span className="mx-3 small fw-bold uppercase" style={{ color: '#915200', letterSpacing: '1px' }}>
                                    PAN Details (KYC)
                                </span>
                                <div style={{ height: '1px', flex: 1, backgroundColor: '#e2d183' }}></div>
                            </div>
                        </Col>
                        <Col md={12}>
                            <Card className="border-0 bg-light p-3">
                                {data.panDetails?.verifiedName && (
                                    <div className="mb-3">
                                        <div className="text-success small fw-bold"><i className="fas fa-check-circle me-1"></i> Verified Name: {data.panDetails.verifiedName}</div>
                                        {nameMismatch && <div className="text-danger small fw-bold mt-1"><i className="fas fa-exclamation-triangle me-1"></i> Name Mismatch with Bank Account</div>}
                                    </div>
                                )}
                                <Row className="g-2">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold uppercase" style={{ color: '#915200' }}>PAN Number</Form.Label>
                                            <Form.Control
                                                name="panNumber"
                                                value={data.panDetails?.panNumber || ''}
                                                onChange={handlePanChange}
                                                disabled={!isEditing}
                                                // size="sm"
                                                className="fw-bold"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2} className="d-flex align-items-end">
                                        {isEditing && (
                                            <Button
                                                variant="light"
                                                // size="sm"
                                                className="w-100 fw-bold"
                                                style={{ borderColor: '#915200', color: '#e2d183', backgroundColor: '#915200' }}
                                                onClick={verifyPanDetails}
                                                disabled={verifyingPan || panVerified}
                                            >
                                                {verifyingPan ? <Spinner size="sm" animation="border" /> : panVerified ? "Verified" : "Verify PAN"}
                                            </Button>
                                        )}
                                        {!isEditing && panVerified && <Badge bg={nameMismatch ? "warning" : "success"} className="mb-2">Verified</Badge>}
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            {/* Label */}
                                            <Form.Label
                                                className="small fw-bold text-uppercase"
                                                style={{ color: '#915200' }}
                                            >
                                                PAN Card Image
                                            </Form.Label>

                                            {/* Image / Upload Section */}
                                            <div className="mt-2">
                                                {data.panDetails?.panImage ? (
                                                    <div className="position-relative d-inline-block">
                                                        <img
                                                            src={`${APIURL.replace('/api', '')}${data.panDetails.panImage}`}
                                                            alt="PAN"
                                                            style={{
                                                                height: '100px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #ddd'
                                                            }}
                                                        />

                                                        {isEditing && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                className="position-absolute top-0 end-0 p-0"
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    borderRadius: '50%',
                                                                    fontSize: 10,
                                                                    transform: 'translate(50%, -50%)'
                                                                }}
                                                                onClick={removePanImageHandler}
                                                            >
                                                                ×
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    isEditing && (
                                                        <>
                                                            <Form.Control
                                                                type="file"
                                                                size="sm"
                                                                accept="image/*"
                                                                onChange={uploadPanImageHandler}
                                                            />
                                                            {uploadingPan && (
                                                                <div className="small text-muted mt-1">
                                                                    Uploading...
                                                                </div>
                                                            )}
                                                        </>
                                                    )
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
                                {data.shopImages && data.shopImages.map((img, idx) => (
                                    <div key={idx} className="position-relative">
                                        <img src={`${APIURL.replace('/api', '')}${img}`} alt="Shop" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                                        {isEditing && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="position-absolute top-0 end-0 p-0"
                                                style={{ width: 20, height: 20, borderRadius: '50%', fontSize: 10 }}
                                                onClick={() => {
                                                    const newImages = data.shopImages.filter((_, i) => i !== idx);
                                                    setData({ ...data, shopImages: newImages });
                                                }}
                                            >X</Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {isEditing && (
                                <Form.Control
                                    type="file"
                                    onChange={uploadFileHandler}
                                    accept="image/*"
                                />
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
                                </div>

                                {data.plan !== 'Premium' && (
                                    <Button
                                        style={{
                                            background: 'linear-gradient(90deg, #915200 0%, #5a3300 100%)',
                                            border: 'none',
                                            boxShadow: '0 4px 12px rgba(145, 82, 0, 0.3)'
                                        }}
                                        size="lg"
                                        className='fw-bold text-white px-4 rounded-pill'
                                        onClick={() => setShowUpgradeModal(true)}
                                    >
                                        Upgrade to Premium <i className="fas fa-arrow-right ms-2"></i>
                                    </Button>
                                )}

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
                                <i className="fas fa-gem fa-3x text-warning mb-3"></i>
                                <h3 className="fw-bold">Premium Benefits</h3>
                                <ul className="list-unstyled text-start mx-auto mt-3" style={{ maxWidth: '300px' }}>
                                    <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Unlimited Chit Plans</li>
                                    <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Verified Badge</li>
                                    <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i>Priority Support</li>
                                </ul>
                                <hr />
                                <div className="display-6 fw-bold text-success">₹5000<span className="fs-6 text-muted">/year</span></div>
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
        </Card>
    );
};

export default MerchantProfile;
