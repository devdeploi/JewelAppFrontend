import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';

const MerchantProfile = ({ merchantData }) => {
    const [data, setData] = useState(merchantData);
    const [isEditing, setIsEditing] = useState(false);

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        setIsEditing(false);
        // In a real app, API call to update profile
        alert("Profile Updated Successfully!");
    };

    return (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="p-4 bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #00008b 0%, #4b0082 100%)' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0"><i className="fas fa-user-circle me-2"></i>Merchant Profile</h4>
                    <Button
                        variant={isEditing ? "light" : "outline-light"}
                        size="sm"
                        onClick={() => isEditing ? document.getElementById('profile-form').requestSubmit() : setIsEditing(true)}
                    >
                        {isEditing ? <><i className="fas fa-save me-1"></i> Save Changes</> : <><i className="fas fa-edit me-1"></i> Edit Profile</>}
                    </Button>
                </div>
            </div>
            <Card.Body className="p-4">
                <Form id="profile-form" onSubmit={handleSave}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-secondary small fw-bold uppercase">Business Name</Form.Label>
                                <Form.Control
                                    name="name"
                                    value={data.name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="bg-light border-0"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-secondary small fw-bold uppercase">Email Address</Form.Label>
                                <Form.Control
                                    name="email"
                                    value={data.email}
                                    onChange={handleChange}
                                    disabled={true} /* Email usually immutable */
                                    className="bg-light border-0 text-muted"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-secondary small fw-bold uppercase">Contact Phone</Form.Label>
                                <Form.Control
                                    name="phone"
                                    value={data.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="bg-light border-0"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-secondary small fw-bold uppercase">Business Address</Form.Label>
                                <Form.Control
                                    name="address"
                                    value={data.address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="bg-light border-0"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <div className="p-3 bg-light rounded mt-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted d-block uppercase fw-bold">Current Plan</small>
                                    <span className={`fw-bold h5 mb-0 text-${data.plan === 'Premium' ? 'warning' : 'primary'}`}>
                                        {data.plan}
                                        {data.plan === 'Premium' && <i className="fas fa-crown ms-2"></i>}
                                    </span>
                                </div>
                                <Button variant="outline-dark" size="sm" disabled>Upgrade Plan</Button>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default MerchantProfile;
