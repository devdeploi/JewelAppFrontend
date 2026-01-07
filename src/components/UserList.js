import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Pagination } from 'react-bootstrap';
// import { users } from '../data/mockData';
import axios from 'axios';
import { APIURL } from '../utils/Function';

const UserList = () => {
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Assuming admin endpoint for users
                const user = JSON.parse(localStorage.getItem('user'));
                const config = {
                    headers: {
                        Authorization: `Bearer ${user?.token}`
                    }
                };
                const { data } = await axios.get(`${APIURL}/users?page=${page}&limit=10`, config);
                if (data.users) { // Check if paginated response structure matches
                    setUsersList(data.users);
                    setTotalPages(data.pages);
                } else {
                    // Fallback for non-paginated API if any
                    setUsersList(data);
                }
            } catch (error) {
                console.error("Error fetching users", error);
            }
        }
        fetchUsers();
    }, [page]);

    return (
        <div className="custom-table-container">
            <h4 className="mb-4 text-secondary">
                <i className="fas fa-users me-2"></i>
                User Directory
            </h4>

            {usersList.length > 0 ? (
                <>
                    <Table responsive hover className="custom-table mb-0">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((user) => (
                                <tr key={user._id}>
                                    <td>{user._id.substring(0, 6)}...</td>
                                    <td className="fw-bold">{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'merchant' ? 'warning' : 'info'}>
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-3">
                            <Pagination>
                                <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                                <Pagination.Prev onClick={() => setPage(page - 1)} disabled={page === 1} />
                                <Pagination.Item disabled>{`${page} / ${totalPages}`}</Pagination.Item>
                                <Pagination.Next onClick={() => setPage(page + 1)} disabled={page === totalPages} />
                                <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
                            </Pagination>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-5 bg-light rounded">
                    <i className="fas fa-users-slash fa-3x text-muted mb-3"></i>
                    <h5 className="text-secondary">No Users Found</h5>
                    {/* <p className="text-muted small">Try checking back later.</p> */}
                </div>
            )}
        </div >
    );
};

export default UserList;
