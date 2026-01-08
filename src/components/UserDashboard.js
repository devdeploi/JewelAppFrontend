import React, { useState } from 'react';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';
import MerchantList from './MerchantList';

const UserDashboard = ({ user, onLogout }) => {
    return (
        <Container className="p-4" fluid>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 style={{ fontFamily: "'Scheherazade New', serif", fontWeight: 700, color: "#915200" }}> <img src="/images/AURUM.png" alt="Logo" className="me-2" style={{ height: '35px' }} /> AURUM</h2>
                    <p className="text-muted">Welcome, {user?.name}</p>
                </div>
                <Button
                    variant="outline-warning"
                    className='rounded-pill fw-bold'
                    style={{ borderColor: '#915200', color: '#915200' }}
                    onClick={onLogout}>
                    Logout
                </Button>
            </div>

            <Row>
                <Col md={12}>
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body>
                            <h4 className="mb-4 text-secondary">Explore Merchants</h4>
                            {/* Reusing Merchant List for browsing */}
                            <MerchantList mode="public" />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default UserDashboard;
