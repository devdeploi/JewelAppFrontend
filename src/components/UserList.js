/* eslint-disable no-unused-vars */
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

    // const handleDeleteClick = (e, user) => {
    //     if (e) e.stopPropagation();
    //     setUserToDelete(user);
    //     setShowDeleteModal(true);
    // };

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
        <div className="custom-table-container p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 bg-white p-4 rounded-4 shadow-sm border border-light">
                <div className="d-flex align-items-center mb-3 mb-md-0">
                    <div className="icon-box me-3 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        <i className="fas fa-users fa-lg" style={{ color: "#D4AF37" }}></i>
                    </div>
                    <div>
                        <h4 className="fw-bold mb-0 text-dark">User Management</h4>
                        <small className="text-muted">View and manage registered users</small>
                    </div>
                </div>
            </div>

            {usersList.length > 0 ? (
                <div className="bg-white rounded-4 shadow-sm border border-light overflow-hidden">
                    <Table hover className="align-middle mb-0 custom-table">
                        <thead className="text-white" style={{ background: 'linear-gradient(90deg, #D4AF37, #C5A028)' }}>
                            <tr>
                                <th className="py-3 ps-4 text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>#</th>
                                <th className="py-3 text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Name</th>
                                <th className="py-3 text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Email</th>
                                <th className="py-3 text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Joined</th>
                                {/* <th className="py-3 pe-4 text-end text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Action</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((user, index) => (
                                <tr
                                    key={user._id}
                                    onClick={() => handleUserClick(user)}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <td className="ps-4 py-3 text-secondary w-auto">{(page - 1) * 10 + index + 1}</td>
                                    <td className="py-3">
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border border-warning me-3" style={{ width: '40px', height: '40px' }}>
                                                {user.profileImage ? (
                                                    <img src={`${BASEURL}${user.profileImage?.startsWith('/') ? '' : '/'}${user.profileImage}`} className="rounded-circle w-100 h-100 object-fit-cover" alt="" onError={onError} />
                                                ) : (
                                                    <span className="fw-bold text-warning">{user.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <span className="fw-bold text-dark">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-muted">{user.email}</td>
                                    <td className="py-3 text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    {/* <td className="pe-4 py-3 text-end">
                                        <Button
                                            size="sm"
                                            variant="light"
                                            className="text-danger rounded-circle shadow-sm border-0"
                                            style={{ width: '32px', height: '32px' }}
                                            onClick={(e) => handleDeleteClick(e, user)}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </Button>
                                    </td> */}
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
                </div>
            ) : (
                <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light mt-4">
                    <div className="mb-3">
                        <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle" style={{ width: '80px', height: '80px' }}>
                            <i className="fas fa-users-slash fa-2x text-muted"></i>
                        </div>
                    </div>
                    <h5 className="text-dark fw-bold">No Users Found</h5>
                    <p className="text-muted">No registered users are currently available.</p>
                </div>
            )}

            {/* User Details Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="xl" contentClassName="border-0 rounded-4 overflow-hidden shadow-lg">
                <Modal.Header closeButton className="border-0 text-white" style={{ background: 'linear-gradient(135deg, #915200, #D4AF37)' }}>
                    <Modal.Title className="fw-bold"><i className="fas fa-user-circle me-2"></i>User Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-0" style={{ height: '70vh', overflow: 'hidden' }}>
                    {selectedUser && (
                        <div className="row g-0 h-100">
                            <div className="col-md-4 bg-white border-end h-100" style={{ overflowY: 'auto' }}>
                                <div className="p-4 text-center">
                                    <div className="position-relative d-inline-block mb-3">
                                        <img
                                            src={`${BASEURL}${selectedUser?.profileImage?.startsWith('/') ? '' : '/'}${selectedUser?.profileImage}`}
                                            className="rounded-circle shadow border border-3 border-warning"
                                            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                            alt={selectedUser.name}
                                            onError={onError}
                                        />
                                        {/* <Badge bg={selectedUser.role === 'admin' ? 'danger' : selectedUser.role === 'merchant' ? 'warning' : 'info'} className="position-absolute bottom-0 end-0 rounded-pill border border-2 border-white px-2">
                                            {selectedUser.role.toUpperCase()}
                                        </Badge> */}
                                    </div>

                                    <h4 className="fw-bold text-dark mb-1">{selectedUser.name}</h4>
                                    <p className="text-secondary mb-4"><i className="far fa-envelope me-2"></i>{selectedUser.email}</p>

                                    <div className="text-start bg-light p-3 rounded-3">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="icon-sm bg-white rounded p-1 me-2 text-warning"><i className="fas fa-phone fa-sm"></i></div>
                                            <span className="fw-medium text-dark">{selectedUser.phone || 'N/A'}</span>
                                        </div>
                                        <div className="d-flex align-items-start mb-3">
                                            <div className="icon-sm bg-white rounded p-1 me-2 text-warning mt-1"><i className="fas fa-map-marker-alt fa-sm"></i></div>
                                            <span className="fw-medium text-dark text-break">{selectedUser.address || 'N/A'}</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <div className="icon-sm bg-white rounded p-1 me-2 text-warning"><i className="fas fa-calendar-alt fa-sm"></i></div>
                                            <span className="fw-medium text-dark">Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-8 bg-light h-100" style={{ overflowY: 'auto' }}>
                                <div className="p-4 h-100 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold m-0" style={{ color: '#915200' }}>Subscribed Plans</h5>
                                        <Badge bg="warning" text="dark" pill className="px-3">Total: {userPlans.length}</Badge>
                                    </div>

                                    {userPlans.length > 0 ? (
                                        <div className="flex-grow-1">
                                            {userPlans.map(plan => {
                                                const totalAmount = plan.totalAmount || (plan.monthlyAmount * plan.durationMonths);
                                                const balance = totalAmount - plan.totalSaved;
                                                const progress = Math.min((plan.installmentsPaid / plan.durationMonths) * 100, 100);

                                                return (
                                                    <div key={plan._id} className="card border-0 shadow-sm mb-3 hover-elevate transition-all">
                                                        <div className="card-body">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="rounded-circle bg-warning bg-opacity-10 p-2 me-3">
                                                                        <i className="fas fa-piggy-bank text-warning"></i>
                                                                    </div>
                                                                    <div>
                                                                        <h6 className="fw-bold text-dark mb-0">{plan.planName}</h6>
                                                                        <small className="text-muted">{plan.merchant?.name}</small>
                                                                    </div>
                                                                </div>
                                                                {/* <Badge bg={plan.status === 'completed' ? 'success' : 'secondary'} pill>
                                                                    {plan.status.toUpperCase()}
                                                                </Badge> */}
                                                            </div>

                                                            <div className="row g-2 mb-3 mt-3">
                                                                <div className="col-4 text-center border-end">
                                                                    <div className="text-muted small text-uppercase">Total</div>
                                                                    <div className="fw-bold text-dark">₹{totalAmount.toLocaleString()}</div>
                                                                </div>
                                                                <div className="col-4 text-center border-end">
                                                                    <div className="text-muted small text-uppercase">Saved</div>
                                                                    <div className="fw-bold text-success">₹{plan.totalSaved.toLocaleString()}</div>
                                                                </div>
                                                                <div className="col-4 text-center">
                                                                    <div className="text-muted small text-uppercase">Balance</div>
                                                                    <div className="fw-bold text-danger">₹{balance.toLocaleString()}</div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-light rounded p-2">
                                                                <div className="d-flex justify-content-between small mb-1">
                                                                    <span className="fw-bold text-dark">Progress</span>
                                                                    <span className="fw-bold" style={{ color: '#915200' }}>{plan.installmentsPaid} / {plan.durationMonths} Months</span>
                                                                </div>
                                                                <div className="progress" style={{ height: '6px' }}>
                                                                    <div
                                                                        className="progress-bar rounded-pill"
                                                                        role="progressbar"
                                                                        style={{ width: `${progress}%`, backgroundColor: '#915200' }}
                                                                        aria-valuenow={progress}
                                                                        aria-valuemin="0"
                                                                        aria-valuemax="100"
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center h-100">
                                            <div className="bg-white p-4 rounded-circle shadow-sm mb-3">
                                                <i className="fas fa-folder-open fa-3x text-muted"></i>
                                            </div>
                                            <h6 className="text-secondary fw-bold">No Subscriptions</h6>
                                            <p className="text-muted small">This user hasn't subscribed to any plans yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-white border-top">
                    <Button variant="light" onClick={handleCloseModal} className="rounded-pill px-4 border shadow-sm">
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
