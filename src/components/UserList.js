import React, { useState, useEffect } from 'react';
import { Table, Badge, Pagination, Modal, Button } from 'react-bootstrap';
// import { users } from '../data/mockData';
import axios from 'axios';
import { APIURL, BASEURL, onError } from '../utils/Function';

const UserList = () => {
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [usersList, setUsersList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

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
    }, [page, refresh]);

    console.log(selectedUser);


    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const handleDeleteClick = (e, user) => {
        if (e) e.stopPropagation();
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const config = {
                headers: {
                    Authorization: `Bearer ${user?.token}`
                }
            };
            await axios.delete(`${APIURL}/users/${userToDelete._id}`, config);
            setRefresh(prev => !prev);
            setShowDeleteModal(false);
            if (selectedUser && selectedUser._id === userToDelete._id) {
                handleCloseModal();
            }
        } catch (error) {
            console.error("Error deleting user", error);
            alert("Failed to delete user. Please try again.");
        }
    };

    return (
        <div className="custom-table-container">
            <h4 className="mb-4 text-secondary">
                <i className="fas fa-users me-2"></i>
                User Management
            </h4>

            {usersList.length > 0 ? (
                <>
                    <Table responsive hover className="custom-table mb-0">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((user, index) => (
                                <tr
                                    key={user._id}
                                    onClick={() => handleUserClick(user)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{(page - 1) * 10 + index + 1}</td>
                                    <td className="fw-bold">{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'merchant' ? 'warning' : 'info'}>
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <Button size="sm" variant="danger" className="text-white p-0 ms-2" onClick={(e) => handleDeleteClick(e, user)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </td>
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

            {/* User Details Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>User Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <div className="text-center">
                            <img
                                src={`${BASEURL}${selectedUser?.profileImage?.startsWith('/') ? '' : '/'}${selectedUser?.profileImage}`}
                                className="mb-3 border border-warning"
                                style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '50%' }}
                                alt={selectedUser.name}
                                onError={onError}
                            />
                            <h4 className="fw-bold">{selectedUser.name}</h4>
                            <p className="text-muted mb-4">{selectedUser.email}</p>

                            <div className="text-start px-3">
                                <div className="mb-2">
                                    <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
                                </div>
                                <div className="mb-2">
                                    <strong>Address:</strong> {selectedUser.address || 'N/A'}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer >
                    {/* <Button variant="danger" onClick={(e) => handleDeleteClick(e, selectedUser)}>
                        Delete User
                    </Button> */}
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title><i className="fas fa-exclamation-triangle me-2"></i>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <div className="mb-3 text-danger">
                        <i className="fas fa-user-times fa-3x"></i>
                    </div>
                    <h5>Are you sure?</h5>
                    <p className="text-muted">
                        Do you really want to delete user <strong>{userToDelete?.name}</strong>?<br />
                        This process cannot be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer className="justify-content-center border-0">
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="px-4">
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} className="px-4">
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
};

export default UserList;
