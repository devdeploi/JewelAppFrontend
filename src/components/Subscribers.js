import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { merchants } from '../data/mockData';

const Subscribers = () => {
    const premiumCount = merchants.filter(m => m.plan === 'Premium').length;
    const standardCount = merchants.filter(m => m.plan === 'Standard').length;
    const total = merchants.length;

    return (
        <div>
            <h4 className="mb-4 text-secondary">
                <i className="fas fa-chart-pie me-2"></i>
                Subscription Analytics
            </h4>
            <Row className="g-4">
                <Col md={4}>
                    <div className="stat-card premium-stat">
                        <div className="stat-icon-wrapper bg-white bg-opacity-25">
                            <i className="fas fa-gem text-white"></i>
                        </div>
                        <h2 className="stat-value">{premiumCount}</h2>
                        <div className="stat-label">Premium Subscribers</div>
                        <div className="mt-2 text-white-50 small">
                            {((premiumCount / total) * 100).toFixed(0)}% of total merchants
                        </div>
                    </div>
                </Col>
                <Col md={4}>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper bg-primary bg-opacity-10">
                            <i className="fas fa-user-tag text-primary"></i>
                        </div>
                        <h2 className="stat-value">{standardCount}</h2>
                        <div className="stat-label">Standard Subscribers</div>
                        <div className="mt-2 text-muted small">
                            {((standardCount / total) * 100).toFixed(0)}% of total merchants
                        </div>
                    </div>
                </Col>
                <Col md={4}>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper bg-success bg-opacity-10">
                            <i className="fas fa-users text-success"></i>
                        </div>
                        <h2 className="stat-value">{total}</h2>
                        <div className="stat-label">Total Merchants</div>
                        <div className="mt-2 text-muted small">
                            Global Platform Scale
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Subscribers;
