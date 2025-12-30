import React from 'react';
import './BottomNav.css';

const BottomNav = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'overview', icon: 'fa-home', label: 'Overview' },
        { id: 'merchants', icon: 'fa-store', label: 'Merchants' },
        { id: 'users', icon: 'fa-users', label: 'Users' },
        { id: 'subscribers', icon: 'fa-chart-pie', label: 'Subscribers' },
    ];

    return (
        <div className="bottom-nav-container">
            <div className="bottom-nav">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`nav-item-custom ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                        title={tab.label}
                    >
                        <i className={`fas ${tab.icon}`}></i>
                        <span className="nav-label">{tab.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
