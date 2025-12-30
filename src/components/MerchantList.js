import React, { useState } from 'react';
import { Table, Badge, Modal, Button, Row, Col, Card } from 'react-bootstrap';
import { merchants, chits } from '../data/mockData';

const MerchantList = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);

    const handleRowClick = (merchant) => {
        setSelectedMerchant(merchant);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setSelectedMerchant(null);
    };

    // Filter chits for the selected merchant
    const merchantChits = selectedMerchant
        ? chits.filter(c => c.merchantId === selectedMerchant.id)
        : [];

    return (
        <div className="custom-table-container">
            <h4 className="mb-4 text-secondary">
                <i className="fas fa-store me-2"></i>
                Merchant Directory
            </h4>
            <Table responsive hover className="custom-table mb-0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {merchants.map((merchant) => (
                        <tr
                            key={merchant.id}
                            onClick={() => handleRowClick(merchant)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>#{merchant.id}</td>
                            <td className="fw-bold">{merchant.name}</td>
                            <td>{merchant.email}</td>
                            <td>
                                <span className={`badge-custom ${merchant.plan === 'Premium' ? 'badge-premium' : 'badge-standard'}`}>
                                    {merchant.plan === 'Premium' ? <i className="fas fa-crown me-1 text-warning"></i> : null}
                                    {merchant.plan}
                                </span>
                            </td>
                            <td>
                                <Badge bg={merchant.status === 'Active' ? 'success' : merchant.status === 'Inactive' ? 'secondary' : 'warning'}>
                                    {merchant.status}
                                </Badge>
                            </td>
                            <td>{merchant.joined}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Merchant Details Modal */}
            <Modal show={showModal} onHide={handleClose} size="lg" centered>
                {selectedMerchant && (
                    <>
                        <Modal.Header closeButton className="border-0 pb-0">
                            <Modal.Title className="fw-bold" style={{ color: '#00008b' }}>
                                <i className="fas fa-store me-2"></i>
                                {selectedMerchant.name}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="p-4">
                            {/* Profile Details */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="text-secondary text-uppercase small fw-bold">Contact Info</h6>
                                    <p className="mb-1"><strong>Email:</strong> {selectedMerchant.email}</p>
                                    <p className="mb-1"><strong>Phone:</strong> {selectedMerchant.phone || 'N/A'}</p>
                                    <p className="mb-0"><strong>Address:</strong> {selectedMerchant.address || 'N/A'}</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-secondary text-uppercase small fw-bold">Account Details</h6>
                                    <p className="mb-1"><strong>Plan:</strong> {selectedMerchant.plan}</p>
                                    <p className="mb-1"><strong>Status:</strong> <span className={`text-${selectedMerchant.status === 'Active' ? 'success' : 'muted'}`}>{selectedMerchant.status}</span></p>
                                    <p className="mb-0"><strong>Joined:</strong> {selectedMerchant.joined}</p>
                                </Col>
                            </Row>

                            <hr className="text-muted opacity-25" />

                            {/* Chit Plans List */}
                            <h5 className="mb-3" style={{ color: '#4b0082' }}>
                                <i className="fas fa-file-invoice-dollar me-2"></i>
                                Active Chit Plans
                            </h5>

                            {merchantChits.length > 0 ? (
                                <Row className="g-3">
                                    {merchantChits.map(chit => (
                                        <Col md={6} key={chit.id}>
                                            <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="fw-bold mb-0 text-dark">{chit.name}</h6>
                                                        <Badge bg={chit.type === 'Gold' ? 'warning' : 'info'}>{chit.type}</Badge>
                                                    </div>
                                                    <p className="small text-muted mb-2">{chit.description}</p>
                                                    <div className="d-flex justify-content-between small">
                                                        <span><strong>Amount:</strong> ₹{chit.amount}</span>
                                                        <span><strong>Duration:</strong> {chit.duration} months</span>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <div className="text-center py-4 bg-light rounded">
                                    <p className="text-muted mb-0">No active chit plans found for this merchant.</p>
                                </div>
                            )}

                        </Modal.Body>
                        <Modal.Footer className="border-0 pt-0">
                            <Button variant="secondary" onClick={handleClose}>Close</Button>
                        </Modal.Footer>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default MerchantList;
