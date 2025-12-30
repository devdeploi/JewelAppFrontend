import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { users } from '../data/mockData';

const UserList = () => {
    return (
        <div className="custom-table-container">
            <h4 className="mb-4 text-secondary">
                <i className="fas fa-users me-2"></i>
                User Directory
            </h4>
            <Table responsive hover className="custom-table mb-0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>#{user.id}</td>
                            <td className="fw-bold">{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <Badge bg={user.status === 'Active' ? 'info' : user.status === 'Banned' ? 'danger' : 'secondary'}>
                                    {user.status}
                                </Badge>
                            </td>
                            <td>{user.joined}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default UserList;
