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

    const [userPlans, setUserPlans] = useState([]);

    useEffect(() => {
        const fetchUserPlans = async () => {
            if (selectedUser) {
                try {
                    const user = JSON.parse(localStorage.getItem('user'));
                    const config = { headers: { Authorization: `Bearer ${user?.token}` } };
                    const { data } = await axios.get(`${APIURL}/chit-plans/user/${selectedUser._id}`, config);
                    setUserPlans(data);
                } catch (error) {
                    console.error("Error fetching user plans", error);
                    setUserPlans([]);
                }
            } else {
                setUserPlans([]);
            }
        };
        fetchUserPlans();
    }, [selectedUser]);

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
            <h5 className="mb-4 fw-semibold" style={{color:"#915200"}}>
                <i className="fas fa-users me-2"></i>
                User Management
            </h5>

            {usersList.length > 0 ? (
                <>
                    <Table responsive hover className="custom-table mb-0">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                {/* <th>Role</th> */}
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
                                    <td className="fw-bold" style={{color:"#915200"}}>{user.name}</td>
                                    <td>{user.email}</td>
                                    {/* <td>
                                        <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'merchant' ? 'warning' : 'info'}>
                                            {user.role}
                                        </Badge>
                                    </td> */}
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
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton style={{ backgroundColor: '#915200', color: '#fff' }}>
                    <Modal.Title><i className="fas fa-user-circle me-2"></i>User Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light">
                    {selectedUser && (
                        <div className="row">
                            <div className="col-md-4 text-center mb-3 mb-md-0">
                                <div className="p-3 bg-white rounded shadow-sm h-100">
                                    <img
                                        src={`${BASEURL}${selectedUser?.profileImage?.startsWith('/') ? '' : '/'}${selectedUser?.profileImage}`}
                                        className="mb-3 border border-3"
                                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', borderColor: '#915200' }}
                                        alt={selectedUser.name}
                                        onError={onError}
                                    />
                                    <h4 className="fw-bold text-dark">{selectedUser.name}</h4>
                                    <Badge bg={selectedUser.role === 'admin' ? 'danger' : selectedUser.role === 'merchant' ? 'warning' : 'info'} className="mb-3">
                                        {selectedUser.role.toUpperCase()}
                                    </Badge>

                                    <div className="text-start mt-3 pt-3 border-top">
                                        <div className="mb-2">
                                            <i className="fas fa-phone me-2 text-secondary"></i>
                                            {selectedUser.phone || 'N/A'}
                                        </div>
                                        <div className="mb-2 text-truncate">
                                            <i className="fas fa-envelope me-2 text-secondary"></i>
                                            <span className=''>{selectedUser.email || 'N/A'}</span>
                                        </div>
                                        <div className="mb-2">
                                            <i className="fas fa-map-marker-alt me-2 text-secondary"></i>
                                            {selectedUser.address || 'N/A'}
                                        </div>
                                        <div className="mb-2">
                                            <i className="fas fa-calendar-alt me-2 text-secondary"></i>
                                            Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-8">
                                <div className="bg-white p-3 rounded shadow-sm h-100">
                                    <h5 className="mb-4 pb-2 border-bottom" style={{ color: '#915200' }}>
                                        <i className="fas fa-piggy-bank me-2"></i>Subscribed Plans
                                    </h5>

                                    {userPlans.length > 0 ? (
                                        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                            {userPlans.map(plan => {
                                                const totalAmount = plan.totalAmount || (plan.monthlyAmount * plan.durationMonths);
                                                const balance = totalAmount - plan.totalSaved;
                                                const progress = Math.min((plan.installmentsPaid / plan.durationMonths) * 100, 100);

                                                return (
                                                    <div key={plan._id} className="p-3 mb-3 bg-light rounded border position-relative overflow-hidden">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <h6 className="fw-bold text-dark mb-0">{plan.planName}</h6>
                                                            <div className="text-end">
                                                                {/* <Badge bg={plan.status === 'completed' ? 'success' : 'secondary'} className="mb-1">{(plan.status).toUpperCase()}</Badge> */}
                                                                <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>{plan.merchant?.name}</small>
                                                            </div>
                                                        </div>

                                                        <div className="row g-2 mb-2 small">
                                                            <div className="col-4">
                                                                <div className="text-muted">Total Goal</div>
                                                                <div className="fw-bold">₹{totalAmount.toLocaleString()}</div>
                                                            </div>
                                                            <div className="col-4">
                                                                <div className="text-muted">Saved</div>
                                                                <div className="fw-bold text-success">₹{plan.totalSaved.toLocaleString()}</div>
                                                            </div>
                                                            <div className="col-4">
                                                                <div className="text-muted">Balance</div>
                                                                <div className="fw-bold text-danger">₹{balance.toLocaleString()}</div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2">
                                                            <div className="d-flex justify-content-between small mb-1">
                                                                <span className="text-muted">Progress</span>
                                                                <span className="fw-bold" style={{ color: '#915200' }}>{plan.installmentsPaid} / {plan.durationMonths} months</span>
                                                            </div>
                                                            <div className="progress" style={{ height: '8px' }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    role="progressbar"
                                                                    style={{ width: `${progress}%`, backgroundColor: '#915200' }}
                                                                    aria-valuenow={progress}
                                                                    aria-valuemin="0"
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5">
                                            <i className="fas fa-folder-open fa-2x text-muted mb-2"></i>
                                            <p className="text-muted small">No active subscriptions found for this user.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-white">
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
