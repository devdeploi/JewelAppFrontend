import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { merchants } from '../data/mockData';

const MerchantList = () => {
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
                        <tr key={merchant.id}>
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
        </div>
    );
};

export default MerchantList;
