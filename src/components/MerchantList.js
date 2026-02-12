import React, { useState, useEffect } from 'react';
import { Table, Badge, Modal, Button, Row, Col, Pagination } from 'react-bootstrap';
// import { merchants, chits } from '../data/mockData'; // Removed mock data import
import axios from 'axios';
import { APIURL } from '../utils/Function';

const MerchantList = ({ mode = 'admin' }) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [merchantsList, setMerchantsList] = useState([]);
    const [merchantChits, setMerchantChits] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        status: mode === 'public' ? 'Approved' : '',
        subscriptionStatus: '',
        search: ''
    });

    const getAuthConfig = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return {
            headers: {
                Authorization: `Bearer ${user?.token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    const fetchMerchants = async () => {
        try {
            const { status, search } = filters;
            let query = `${APIURL}/merchants?page=${page}&limit=10`;
            console.log(query);

            const config = mode === 'admin' ? getAuthConfig() : {};

            // Force approved for public
            if (mode === 'public') {
                query += `&status=Approved`;
            } else if (status) {
                query += `&status=${status}`;
            }

            if (filters.subscriptionStatus) {
                query += `&subscriptionStatus=${filters.subscriptionStatus}`;
            }

            if (search) query += `&keyword=${search}`;

            const response = await axios.get(query, config);
            console.log(response);

            setMerchantsList(response.data.merchants);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error("Error fetching merchants", error);
        }
    };

    useEffect(() => {
        fetchMerchants();
        // eslint-disable-next-line
    }, [page, filters, mode]); // Added mode to dependency array

    const [confirmation, setConfirmation] = useState({
        show: false,
        action: '', // 'Approve', 'Reject', 'Pending', 'Delete'
        id: null,
        merchantName: ''
    });

    const triggerAction = (merchant, action) => {
        setConfirmation({
            show: true,
            action,
            id: merchant._id,
            merchantName: merchant.name
        });
    };

    const executeAction = async () => {
        try {
            setActionLoading(true);
            const config = getAuthConfig();
            const { action, id } = confirmation;
            if (action === 'Delete') {
                await axios.delete(`${APIURL}/merchants/${id}`, config);
                setMerchantsList(merchantsList.filter(m => m._id !== id));
            } else {
                // Status update
                const status = action === 'Pending' ? 'Pending' : action === 'Reject' ? 'Rejected' : 'Approved';
                await axios.put(`${APIURL}/merchants/${id}/status`, { status }, config);
                fetchMerchants(); // Refresh list to reflect changes

                if (selectedMerchant && selectedMerchant._id === id) {
                    setSelectedMerchant({ ...selectedMerchant, status });
                }
            }
            setConfirmation({ show: false, action: '', id: null, merchantName: '' });
        } catch (error) {
            console.error(error);
            alert(`Failed to ${confirmation.action}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRowClick = async (merchant) => {
        setSelectedMerchant(merchant);
        setShowModal(true);
        try {
            const response = await axios.get(`${APIURL}/chit-plans/merchant/${merchant._id}?limit=20`);
            setMerchantChits(response.data.plans || []);
        } catch (error) {
            console.error("Error fetching chits", error);
            setMerchantChits([]);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setSelectedMerchant(null);
        setMerchantChits([]);
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('button');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;

            // Create a temporary anchor element to trigger the download
            const a = document.createElement('a');
            a.href = link.href;
            a.download = link.download;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download file");
        }
    };

    return (
        <div className="custom-table-container p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 bg-white p-4 rounded-4 shadow-sm border border-light">
                <div className="d-flex align-items-center mb-3 mb-md-0">
                    <div className="icon-box me-3 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        <i className="fas fa-store fa-lg" style={{ color: "#D4AF37" }}></i>
                    </div>
                    <div>
                        <h4 className="fw-bold mb-0 text-dark">Merchant Directory</h4>
                        <small className="text-muted">Manage and view all registered merchants</small>
                    </div>
                </div>

                <div className="d-flex gap-3 flex-wrap">
                    {mode !== 'public' && (
                        <select
                            className="form-select border-0 bg-light fw-medium"
                            style={{ width: '150px', boxShadow: 'none' }}
                            onChange={e => {
                                setPage(1);
                                setFilters({ ...filters, status: e.target.value });
                            }}
                        >
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    )}
                    {mode !== 'public' && (
                        <select
                            className="form-select border-0 bg-light fw-medium"
                            style={{ width: '180px', boxShadow: 'none' }}
                            onChange={e => {
                                setPage(1);
                                setFilters({ ...filters, subscriptionStatus: e.target.value });
                            }}
                        >
                            <option value="">All Subscriptions</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    )}
                    <div className="position-relative">
                        <i className="fas fa-search position-absolute text-muted" style={{ top: '12px', left: '15px' }}></i>
                        <input
                            type="text"
                            className="form-control ps-5 border-0 bg-light"
                            placeholder="Search merchants..."
                            style={{ width: '250px', boxShadow: 'none' }}
                            onChange={e => {
                                setPage(1);
                                setFilters({ ...filters, search: e.target.value });
                            }}
                        />
                    </div>
                </div>
            </div>

            {merchantsList && merchantsList.length > 0 ? (
                <div className="bg-white rounded-4 shadow-sm border border-light overflow-hidden">
                    <Table hover className="align-middle mb-0 custom-table">
                        <thead className="text-white" style={{ background: 'linear-gradient(90deg, #D4AF37, #C5A028)' }}>
                            <tr>
                                <th className="py-3 ps-4 text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Merchant</th>
                                <th className="py-3 text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Contact Detail</th>
                                <th className="py-3 text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Active Plan</th>
                                {mode !== 'public' && <th className="py-3 text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Current Status</th>}
                                {mode !== 'public' && <th className="py-3 pe-4 text-end text-uppercase small fw-bold" style={{ letterSpacing: '1px', borderBottom: 'none' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {merchantsList.map((merchant) => (
                                <tr key={merchant._id} style={{ transition: 'all 0.2s' }}>
                                    <td className="ps-4 py-3" onClick={() => handleRowClick(merchant)} style={{ cursor: 'pointer' }}>
                                        <div className="d-flex align-items-center">
                                            <div className="position-relative">
                                                {merchant.shopImages && merchant.shopImages.length > 0 ?
                                                    <img
                                                        src={`${APIURL.replace('/api', '')}${merchant.shopImages[0]}`}
                                                        alt="Shop"
                                                        className="rounded-circle shadow-sm border border-white"
                                                        style={{ width: 48, height: 48, objectFit: 'cover' }}
                                                    /> :
                                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center shadow-sm" style={{ width: 48, height: 48 }}>
                                                        <i className="fas fa-store text-muted"></i>
                                                    </div>
                                                }
                                                <span className={`position-absolute bottom-0 end-0 p-1 rounded-circle border border-white ${merchant.status === 'Approved' ? 'bg-success' : merchant.status === 'Pending' ? 'bg-warning' : 'bg-danger'}`} style={{ width: '12px', height: '12px' }}></span>
                                            </div>
                                            <div className="ms-3">
                                                <h6 className="mb-0 fw-bold text-dark">{merchant.name}</h6>
                                                {/* <small className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {merchant._id.substring(merchant._id.length - 6).toUpperCase()}</small> */}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3" onClick={() => handleRowClick(merchant)} style={{ cursor: 'pointer' }}>
                                        <div className="d-flex flex-column">
                                            <span className="text-dark fw-medium mb-1"><i className="far fa-envelope me-2 text-muted"></i>{merchant.email}</span>
                                            {merchant.phone && <span className="text-muted small"><i className="fas fa-phone me-2 text-muted"></i>{merchant.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <div className="d-flex flex-column align-items-start">
                                            <Badge
                                                className={`px-3 py-2 rounded-pill fw-medium mb-1 ${merchant.plan === 'Premium' ? 'bg-gradient-gold text-white' : 'bg-light text-dark border'}`}
                                                style={merchant.plan === 'Premium' ? { background: 'linear-gradient(45deg, #D4AF37, #C5A028)' } : {}}
                                            >
                                                {merchant.plan === 'Premium' && <i className="fas fa-crown me-1"></i>}
                                                {merchant.plan}
                                            </Badge>

                                            {merchant.subscriptionExpiryDate && (
                                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    {(() => {
                                                        const expiry = new Date(merchant.subscriptionExpiryDate);
                                                        const today = new Date();
                                                        const diffTime = expiry - today;
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                        if (diffDays < 0 || merchant.subscriptionStatus === 'expired') return <span className="text-danger fw-bold"><i className="fas fa-exclamation-circle me-1"></i>Expired</span>;
                                                        if (diffDays <= 7) return <span className="text-warning fw-bold"><i className="fas fa-clock me-1"></i>Expiring in {diffDays}d</span>;
                                                        return <span className="text-success"><i className="fas fa-check-circle me-1"></i>Active ({diffDays}d)</span>;
                                                    })()}
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    {mode !== 'public' && (
                                        <td className="py-3">
                                            <Badge bg={merchant.status === 'Approved' ? 'success' : merchant.status === 'Rejected' ? 'danger' : 'warning'} pill className="px-3 py-2">
                                                {merchant.status || 'Pending'}
                                            </Badge>
                                        </td>
                                    )}
                                    {mode !== 'public' && (
                                        <td className="py-3 pe-4 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                {merchant.status === 'Pending' && (
                                                    <>
                                                        <Button variant="success" size="sm" className="btn-action rounded-pill px-3" onClick={() => triggerAction(merchant, 'Approve')}><i className="fas fa-check me-1"></i>Approve</Button>
                                                        <Button variant="danger" size="sm" className="btn-action rounded-pill px-3" onClick={() => triggerAction(merchant, 'Reject')}><i className="fas fa-times me-1"></i>Reject</Button>
                                                    </>
                                                )}
                                                {merchant.status === 'Approved' && (
                                                    <>
                                                        <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => triggerAction(merchant, 'Reject')}>Reject</Button>
                                                        <Button variant="outline-warning" size="sm" className="rounded-pill px-3" onClick={() => triggerAction(merchant, 'Pending')}>Pending</Button>
                                                    </>
                                                )}
                                                {merchant.status === 'Rejected' && (
                                                    <Button variant="outline-success" size="sm" className="rounded-pill px-3" onClick={() => triggerAction(merchant, 'Approve')}>Approve</Button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center py-4 border-top">
                            <Pagination className="custom-pagination">
                                <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                                <Pagination.Prev onClick={() => setPage(page - 1)} disabled={page === 1} />
                                <Pagination.Item active>{page}</Pagination.Item>
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
                            <i className="fas fa-search fa-2x text-muted"></i>
                        </div>
                    </div>
                    <h5 className="text-dark fw-bold">No Merchants Found</h5>
                    <p className="text-muted">Try adjusting your filters or search query.</p>
                </div>
            )}

            {/* Merchant Details Modal */}
            <Modal show={showModal} onHide={handleClose} size="xl" centered contentClassName="border-0 rounded-4 overflow-hidden shadow-lg">
                <Modal.Header closeButton className="border-0 text-white" style={{ background: 'linear-gradient(135deg, #915200, #D4AF37)' }}>
                    <Modal.Title className="fw-bold"><i className="fas fa-store-alt me-2"></i>Merchant Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-0" style={{ height: '75vh', overflow: 'hidden' }}>
                    {selectedMerchant && (
                        <Row className="g-0 h-100">
                            {/* Left Column: Profile & Details - Independent Scroll */}
                            <Col md={4} className="bg-white border-end position-relative h-100" style={{ overflowY: 'auto' }}>
                                <div className="p-4 text-center">
                                    <div className="position-relative d-inline-block mb-3">
                                        {selectedMerchant.shopImages && selectedMerchant.shopImages.length > 0 ? (
                                            <img
                                                src={`${APIURL.replace('/api', '')}${selectedMerchant.shopImages[0]}`}
                                                alt="Shop"
                                                className="rounded-circle shadow border border-3 border-warning"
                                                style={{ width: '140px', height: '140px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center shadow border border-3 border-warning" style={{ width: '140px', height: '140px' }}>
                                                <i className="fas fa-store fa-3x text-secondary"></i>
                                            </div>
                                        )}
                                        <Badge
                                            bg={selectedMerchant.status === 'Approved' ? 'success' : selectedMerchant.status === 'Rejected' ? 'danger' : 'warning'}
                                            className="position-absolute bottom-0 end-0 rounded-circle p-2 border border-2 border-white"
                                            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className={`fas fa-${selectedMerchant.status === 'Approved' ? 'check' : selectedMerchant.status === 'Rejected' ? 'times' : 'clock'}`}></i>
                                        </Badge>
                                    </div>

                                    <h4 className="fw-bold text-dark mb-1">{selectedMerchant.name}</h4>
                                    <p className="text-secondary mb-3"><i className="far fa-envelope me-2"></i>{selectedMerchant.email}</p>

                                    <div className="d-flex justify-content-center gap-2 mb-4">
                                        <Badge
                                            className={`px-3 py-2 rounded-pill fw-medium ${selectedMerchant.plan === 'Premium' ? 'bg-gradient-gold text-white' :
                                                selectedMerchant.plan === 'Standard' ? 'bg-secondary text-white' :
                                                    'bg-light text-dark border'
                                                }`}
                                            style={selectedMerchant.plan === 'Premium' ? { background: 'linear-gradient(45deg, #D4AF37, #C5A028)' } : {}}
                                        >
                                            {selectedMerchant.plan === 'Premium' && <i className="fas fa-crown me-1"></i>}
                                            {selectedMerchant.plan} Plan
                                        </Badge>
                                    </div>

                                    <div className="text-start bg-light p-3 rounded-3 mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="icon-sm bg-white rounded p-1 me-2 text-warning"><i className="fas fa-phone fa-sm"></i></div>
                                            <span className="small fw-medium">{selectedMerchant.phone || 'N/A'}</span>
                                        </div>
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="icon-sm bg-white rounded p-1 me-2 text-warning"><i className="fas fa-map-marker-alt fa-sm"></i></div>
                                            <span className="small fw-medium text-truncate">{selectedMerchant.address || 'N/A'}</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <div className="icon-sm bg-white rounded p-1 me-2 text-warning"><i className="fas fa-calendar-alt fa-sm"></i></div>
                                            <span className="small fw-medium">Joined {new Date(selectedMerchant.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="text-start">
                                        <h6 className="fw-bold text-uppercase text-secondary small mb-3" style={{ letterSpacing: '1px' }}>Subscription Details</h6>

                                        <div className="mb-3">
                                            <small className="d-block text-muted mb-1">Expiry Date</small>
                                            {selectedMerchant.subscriptionExpiryDate ? (
                                                <div className="d-flex align-items-center">
                                                    <span className="fw-bold text-dark me-2">{new Date(selectedMerchant.subscriptionExpiryDate).toLocaleDateString()}</span>
                                                    {new Date(selectedMerchant.subscriptionExpiryDate) < new Date() && <Badge bg="danger" className="rounded-pill">Expired</Badge>}
                                                </div>
                                            ) : <span className="text-dark fw-medium">N/A</span>}
                                        </div>

                                        <div className="mb-3">
                                            <small className="d-block text-muted mb-1">GSTIN</small>
                                            <span className="fw-bold text-dark font-monospace">{selectedMerchant.gstin || 'N/A'}</span>
                                        </div>

                                        {selectedMerchant.addressProof && (
                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                className="w-100 rounded-pill mt-2"
                                                onClick={() => handleDownload(
                                                    `${APIURL.replace('/api', '')}${selectedMerchant.addressProof}`,
                                                    `AddressProof_${selectedMerchant.name.replace(/\s+/g, '_')}.jpg`
                                                )}
                                            >
                                                <i className="fas fa-file-download me-2"></i>Download Address Proof
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Col>

                            {/* Right Column: Chits & Activity - Independent Scroll */}
                            <Col md={8} className="bg-light h-100" style={{ overflowY: 'auto' }}>
                                <div className="p-4 h-100 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold m-0" style={{ color: '#915200' }}>Active Chit Plans</h5>
                                        <Badge bg="warning" text="dark" pill className="px-3">Total: {merchantChits.length}</Badge>
                                    </div>

                                    {merchantChits.length > 0 ? (
                                        <div className="flex-grow-1 overflow-auto pe-2 custom-scrollbar">
                                            <Row className="g-3">
                                                {merchantChits.map(chit => (
                                                    <Col md={6} key={chit._id}>
                                                        <div className="card h-100 border-0 shadow-sm hover-elevate transition-all">
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div className="rounded-circle bg-warning bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                                        <i className="fas fa-piggy-bank text-warning"></i>
                                                                    </div>
                                                                    <Badge bg="dark" className="rounded-pill">{chit.durationMonths} Months</Badge>
                                                                </div>
                                                                <h6 className="fw-bold text-dark mb-1">{chit.planName}</h6>
                                                                <p className="text-secondary small mb-3 text-truncate">{chit.description}</p>

                                                                <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-auto">
                                                                    <div>
                                                                        <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Monthly</small>
                                                                        <span className="fw-bold" style={{ color: '#915200' }}>₹{chit.monthlyAmount}</span>
                                                                    </div>
                                                                    <div className="text-end">
                                                                        <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Subscribers</small>
                                                                        <span className="fw-bold text-dark">{chit.subscribers ? chit.subscribers.length : 0}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center h-100">
                                            <div className="bg-white p-4 rounded-circle shadow-sm mb-3">
                                                <i className="fas fa-folder-open fa-3x text-muted"></i>
                                            </div>
                                            <h6 className="text-secondary fw-bold">No Active Plans</h6>
                                            <p className="text-muted small">This merchant hasn't created any chit plans yet.</p>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                {mode !== 'public' && selectedMerchant && (
                    <Modal.Footer className="bg-white border-top">
                        <div className="d-flex gap-2 w-100 justify-content-end">
                            <Button variant="light" onClick={handleClose} className="rounded-pill px-4 fw-medium border">Close</Button>
                            {selectedMerchant.status === 'Pending' && (
                                <>
                                    <Button className="rounded-pill px-4 text-white border-0" style={{ background: 'linear-gradient(to right, #48bb78, #38a169)' }} onClick={() => { handleClose(); triggerAction(selectedMerchant, 'Approve'); }}>
                                        <i className="fas fa-check me-2"></i>Approve Merchant
                                    </Button>
                                    <Button className="rounded-pill px-4 text-white border-0" style={{ background: 'linear-gradient(to right, #f56565, #e53e3e)' }} onClick={() => { handleClose(); triggerAction(selectedMerchant, 'Reject'); }}>
                                        <i className="fas fa-times me-2"></i>Reject Merchant
                                    </Button>
                                </>
                            )}
                            {selectedMerchant.status === 'Approved' && (
                                <Button className="rounded-pill px-4 text-white border-0" style={{ background: 'linear-gradient(to right, #f56565, #e53e3e)' }} onClick={() => { handleClose(); triggerAction(selectedMerchant, 'Reject'); }}>
                                    <i className="fas fa-ban me-2"></i>Reject Access
                                </Button>
                            )}
                        </div>
                    </Modal.Footer>
                )}
            </Modal>

            {/* Confirmation Modal */}
            {/* Confirmation Modal */}
            <Modal show={confirmation.show} onHide={() => !actionLoading && setConfirmation({ ...confirmation, show: false })} centered backdrop={actionLoading ? 'static' : true} keyboard={!actionLoading}>
                {!actionLoading ? (
                    <>
                        <Modal.Header closeButton className={confirmation.action === 'Delete' ? "bg-danger text-white" : "border-0"}>
                            <Modal.Title style={{ color: confirmation.action === 'Delete' ? '#fff' : '#915200' }}>
                                {confirmation.action === 'Delete' ? <><i className="fas fa-exclamation-triangle me-2"></i>Confirm Deletion</> : 'Confirm Action'}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="text-center py-4">
                            {confirmation.action === 'Delete' && (
                                <div className="mb-3 text-danger">
                                    <i className="fas fa-store-slash fa-3x"></i>
                                </div>
                            )}
                            <h5>Are you sure?</h5>
                            <p className="text-muted">
                                Do you really want to <strong>{confirmation.action}</strong> merchant <strong>{confirmation.merchantName}</strong>?
                                {confirmation.action === 'Delete' && <><br />This process cannot be undone.</>}
                            </p>
                        </Modal.Body>
                        <Modal.Footer className="justify-content-center border-0">
                            <Button variant="secondary" onClick={() => setConfirmation({ ...confirmation, show: false })} className="px-4">
                                Cancel
                            </Button>
                            <Button
                                variant={confirmation.action === 'Delete' ? 'danger' : 'primary'}
                                style={confirmation.action === 'Delete' ? {} : { backgroundColor: '#915200', borderColor: '#915200' }}
                                onClick={executeAction}
                                className="px-4"
                            >
                                {confirmation.action === 'Delete' ? 'Delete' : `Yes, ${confirmation.action}`}
                            </Button>
                        </Modal.Footer>
                    </>
                ) : (
                    <Modal.Body className="text-center py-5">
                        <div className="position-relative d-inline-block mb-4">
                            <div className="spinner-border text-warning position-absolute top-50 start-50 translate-middle" style={{ width: '5rem', height: '5rem', opacity: 0.3 }} role="status"></div>
                            <div className="rounded-circle d-flex align-items-center justify-content-center bg-light shadow-sm position-relative" style={{ width: '80px', height: '80px', zIndex: 1 }}>
                                <i className="fas fa-envelope fa-2x animate__animated animate__tada" style={{ color: '#915200' }}></i>
                            </div>
                            <i className="fas fa-paper-plane position-absolute top-0 start-100 translate-middle text-success fa-lg animate__animated animate__fadeInUp animate__infinite" style={{ animationDuration: '1.5s' }}></i>
                        </div>
                        <h5 className="fw-bold mb-2 type-writer" style={{ color: '#915200' }}>Sending Notification...</h5>
                        <p className="text-muted small mb-0">Please wait while we update the status and notify the merchant via email.</p>
                    </Modal.Body>
                )}
            </Modal>
        </div>
    );
};

export default MerchantList;
