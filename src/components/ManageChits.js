import React, { useState } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { chits } from '../data/mockData';

const ManageChits = ({ merchantId }) => {
    // Filter chits for this merchant (using mock logic)
    // For demo, we might show a subset or all if ID matches. 
    // In mockData chits have merchantId.

    // Defaulting to merchantId 1 for demo purposes if not passed correctly or new user
    const [myChits, setMyChits] = useState(chits.filter(c => c.merchantId === (merchantId || 1)) || []);
    const [showModal, setShowModal] = useState(false);
    const [currentChit, setCurrentChit] = useState(null); // null = new, object = edit

    const handleSaveChit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newChit = {
            id: currentChit ? currentChit.id : Date.now(),
            merchantId: merchantId || 1,
            name: formData.get('name'),
            type: formData.get('type'),
            amount: formData.get('amount'),
            duration: formData.get('duration'),
            description: formData.get('description'),
        };

        if (currentChit) {
            setMyChits(myChits.map(c => c.id === currentChit.id ? newChit : c));
        } else {
            setMyChits([...myChits, newChit]);
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this plan?")) {
            setMyChits(myChits.filter(c => c.id !== id));
        }
    }

    const openModal = (chit = null) => {
        setCurrentChit(chit);
        setShowModal(true);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="text-secondary mb-0"><i className="fas fa-coins me-2"></i>Manage Chit Plans</h4>
                <Button style={{background :'linear-gradient(135deg, #00008b 0%, #4b0082 100%)',border: 'none' }} className="rounded-pill" onClick={() => openModal()}>
                    <i className="fas fa-plus me-2"></i>Create New Plan
                </Button>
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
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Duration</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myChits.map(chit => (
                                <tr key={chit.id}>
                                    <td className="fw-bold">{chit.name}</td>
                                    <td><Badge bg="info">{chit.type}</Badge></td>
                                    <td>₹{chit.amount}</td>
                                    <td>{chit.duration} Months</td>
                                    <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{chit.description}</td>
                                    <td>
                                        <Button variant="link" className="text-primary p-0 me-3" onClick={() => openModal(chit)}>
                                            <i className="fas fa-edit"></i>
                                        </Button>
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(chit.id)}>
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
                    <Modal.Title>{currentChit ? 'Edit Plan' : 'Create New Plan'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSaveChit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Plan Name</Form.Label>
                            <Form.Control name="name" defaultValue={currentChit?.name} required placeholder="e.g. Gold Saver" />
                        </Form.Group>
                        <Row className="g-3 mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Type</Form.Label>
                                    <Form.Select name="type" defaultValue={currentChit?.type || 'Gold'}>
                                        <option value="Gold">Gold</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Diamond">Diamond</option>
                                        <option value="Platinum">Platinum</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Total Amount (₹)</Form.Label>
                                    <Form.Control name="amount" type="number" defaultValue={currentChit?.amount} required placeholder="5000" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Duration (Months)</Form.Label>
                            <Form.Range
                                name="duration"
                                min="1" max="60"
                                defaultValue={currentChit?.duration || 11}
                                onChange={(e) => document.getElementById('duration-val').innerText = e.target.value + ' Months'}
                            />
                            <div className="text-center fw-bold text-secondary" id="duration-val">{currentChit?.duration || 11} Months</div>
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>Description / Benefits</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" defaultValue={currentChit?.description} placeholder="Describe the benefits..." />
                        </Form.Group>
                        <Button style={{background :'linear-gradient(135deg, #00008b 0%, #4b0082 100%)',border: 'none' }} type="submit" className="w-100 rounded-pill">
                            Save Plan
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ManageChits;
