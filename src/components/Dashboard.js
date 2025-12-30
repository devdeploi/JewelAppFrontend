import React, { useState } from 'react';
import {  Row, Col, Button } from 'react-bootstrap';
import MerchantList from './MerchantList';
import UserList from './UserList';
import Subscribers from './Subscribers';
import BottomNav from './BottomNav';
import { merchants, users } from '../data/mockData';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'merchants':
                return <MerchantList />;
            case 'users':
                return <UserList />;
            case 'subscribers':
                return <Subscribers />;
            case 'overview':
            default:
                return (
                    <Row className="g-4">
                        <Col md={3}>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper bg-info bg-opacity-10">
                                    <i className="fas fa-store text-info"></i>
                                </div>
                                <h3 className="stat-value">{merchants.length}</h3>
                                <div className="stat-label">Total Merchants</div>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper bg-warning bg-opacity-10">
                                    <i className="fas fa-user text-warning"></i>
                                </div>
                                <h3 className="stat-value">{users.length}</h3>
                                <div className="stat-label">Total Users</div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="stat-card premium-stat">
                                <h3>Welcome Back, Admin</h3>
                                <p className="mb-0 text-white-50">You have {merchants.filter(m => m.status === 'Pending').length} pending merchant approvals today.</p>
                            </div>
                        </Col>
                        <Col md={12} className="mt-4">
                            <Subscribers />
                        </Col>
                    </Row>
                );
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <h2 className="dashboard-title">
                    <i className="fas fa-gem text-primary me-2"></i>
                    Jewel Pro
                </h2>
                <Button variant="outline-danger" className="rounded-pill px-4" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                </Button>
            </div>

            {/* Main Content */}
            <div className="dashboard-content animate__animated animate__fadeIn">
                {renderContent()}
            </div>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};

export default Dashboard;
