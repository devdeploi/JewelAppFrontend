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

            const response = await axios.get(query);
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
        <div className="custom-table-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-semibold mb-0" style={{color:"#915200"}}>
                    <i className="fas fa-store me-2"></i>
                    Merchant Directory
                </h5>
                <div className="d-flex gap-2">
                    {mode !== 'public' && (
                        <select className="form-select" onChange={e => {
                            setPage(1);
                            setFilters({ ...filters, status: e.target.value });
                        }}>
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    )}
                    {mode !== 'public' && (
                        <select className="form-select" onChange={e => {
                            setPage(1);
                            setFilters({ ...filters, subscriptionStatus: e.target.value });
                        }}>
                            <option value="">All Subscriptions</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    )}
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search..."
                        onChange={e => {
                            setPage(1);
                            setFilters({ ...filters, search: e.target.value });
                        }}
                    />
                </div>
            </div>

            {merchantsList && merchantsList.length > 0 ? (
                <>
                    <Table responsive hover className="custom-table mb-0">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Plan</th>
                                {mode !== 'public' && <th>Status</th>}
                                {mode !== 'public' && <th>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {merchantsList.map((merchant) => (
                                <tr key={merchant._id}>
                                    <td onClick={() => handleRowClick(merchant)} style={{ cursor: 'pointer' }}>
                                        {merchant.shopImages && merchant.shopImages.length > 0 ?
                                            <img src={`${APIURL.replace('/api', '')}${merchant.shopImages[0]}`} alt="Shop" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> :
                                            <i className="fas fa-store fa-2x text-muted"></i>
                                        }
                                    </td>
                                    <td className="fw-bold" onClick={() => handleRowClick(merchant)} style={{ cursor: 'pointer', color: '#915200' }}>{merchant.name}</td>
                                    <td>{merchant.email}</td>
                                    <td>
                                        <span className={`badge-custom ${merchant.plan === 'Premium' ? 'badge-premium' : 'badge-standard'}`}>
                                            {merchant.plan === 'Premium' && <i className="fas fa-crown me-1 text-warning"></i>}
                                            {merchant.plan}
                                        </span>
                                        {/* Expiry Indicator */}
                                        {merchant.subscriptionExpiryDate && (
                                            <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                                {(() => {
                                                    const expiry = new Date(merchant.subscriptionExpiryDate);
                                                    const today = new Date();
                                                    const diffTime = expiry - today;
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                    if (diffDays < 0 || merchant.subscriptionStatus === 'expired') return <span className="text-danger fw-bold">Expired</span>;
                                                    if (diffDays <= 7) return <span className="text-warning fw-bold">Expiring in {diffDays}d</span>;
                                                    return <span>Active ({diffDays}d left)</span>;
                                                })()}
                                            </div>
                                        )}
                                    </td>
                                    {mode !== 'public' && (
                                        <td>
                                            <Badge bg={merchant.status === 'Approved' ? 'success' : merchant.status === 'Rejected' ? 'danger' : 'warning'}>
                                                {merchant.status || 'Pending'}
                                            </Badge>
                                        </td>
                                    )}
                                    {mode !== 'public' && (
                                        <td>
                                            <div className="d-flex gap-2">
                                                {merchant.status === 'Pending' && (
                                                    <>
                                                        <Button size="sm" style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }} onClick={() => triggerAction(merchant, 'Approve')}>Approve</Button>
                                                        <Button size="sm" style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }} onClick={() => triggerAction(merchant, 'Reject')}>Reject</Button>
                                                    </>
                                                )}
                                                {merchant.status === 'Approved' && (
                                                    <>
                                                        <Button size="sm" style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }} onClick={() => triggerAction(merchant, 'Reject')}>Reject</Button>
                                                        <Button size="sm" style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }} onClick={() => triggerAction(merchant, 'Pending')}>Pending</Button>
                                                    </>
                                                )}
                                                {merchant.status === 'Rejected' && (
                                                    <>
                                                        <Button size="sm" style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }} onClick={() => triggerAction(merchant, 'Approve')}>Approve</Button>
                                                        {/* <Button size="sm" variant="outline-dark" style={{ borderColor: '#915200', color: '#915200' }} onClick={() => triggerAction(merchant, 'Pending')}>Pending</Button> */}
                                                    </>
                                                )}
                                                {/* <Button size="sm" variant="danger" className="text-white p-0 ms-2" onClick={() => triggerAction(merchant, 'Delete')}>
                                                    <i className="fas fa-trash"></i>
                                                </Button> */}
                                            </div>
                                        </td>
                                    )}
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
                    <i className="fas fa-store-slash fa-3x text-muted mb-3"></i>
                    <h5 className="text-secondary">No Merchants Found</h5>
                    {/* <p className="text-muted small">Try adjusting your search or filters.</p> */}
                </div>
            )}

            {/* Merchant Details Modal */}
            <Modal show={showModal} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton style={{ backgroundColor: '#915200', color: '#fff' }}>
                    <Modal.Title><i className="fas fa-store me-2"></i>Merchant Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light">
                    {selectedMerchant && (
                        <Row>
                            {/* Left Column: Details */}
                            <Col md={4} className="mb-3 mb-md-0">
                                <div className="p-3 bg-white rounded shadow-sm h-100">
                                    <div className="text-center">
                                        {selectedMerchant.shopImages && selectedMerchant.shopImages.length > 0 ? (
                                            <img
                                                src={`${APIURL.replace('/api', '')}${selectedMerchant.shopImages[0]}`}
                                                alt="Shop"
                                                className="mb-3 border border-3"
                                                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', borderColor: '#915200' }}
                                            />
                                        ) : (
                                            <div className="mb-3 d-inline-flex align-items-center justify-content-center bg-light border border-3" style={{ width: '120px', height: '120px', borderRadius: '50%', borderColor: '#915200' }}>
                                                <i className="fas fa-store fa-3x text-secondary"></i>
                                            </div>
                                        )}
                                        <h5 className="fw-bold text-dark">{selectedMerchant.name}</h5>
                                        <p className="text-secondary mb-2 small">{selectedMerchant.email}</p>

                                        <div className="mb-3">
                                            <span className={`badge-custom ${selectedMerchant.plan === 'Premium' ? 'badge-premium' : 'badge-standard'} me-2`}>
                                                {selectedMerchant.plan}
                                            </span>
                                            {mode !== 'public' && (
                                                <Badge bg={selectedMerchant.status === 'Approved' ? 'success' : selectedMerchant.status === 'Rejected' ? 'danger' : 'warning'}>
                                                    {selectedMerchant.status}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-start mt-3 pt-3 border-top small">
                                        <div className="mb-2"><strong>Phone:</strong> {selectedMerchant.phone || 'N/A'}</div>
                                        <div className="mb-2"><strong>Address:</strong> {selectedMerchant.address || 'N/A'}</div>
                                        <div className="mb-2"><strong>Joined:</strong> {new Date(selectedMerchant.createdAt).toLocaleDateString()}</div>

                                        <hr className="my-2" />

                                        <p className="mb-1 fw-bold text-dark">Subscription:</p>
                                        <div className="mb-2">
                                            {selectedMerchant.subscriptionExpiryDate ? (
                                                <>
                                                    {new Date(selectedMerchant.subscriptionExpiryDate).toLocaleDateString()}
                                                    {new Date(selectedMerchant.subscriptionExpiryDate) < new Date() && <Badge bg="danger" className="ms-1">Expired</Badge>}
                                                </>
                                            ) : 'N/A'}
                                        </div>

                                        <hr className="my-2" />

                                        <p className="mb-1 fw-bold text-dark">GSTIN:</p>
                                        <div className="mb-2">{selectedMerchant.gstin || 'N/A'}</div>

                                        {selectedMerchant.addressProof && (
                                            <div className="mt-2">
                                                <p className="mb-1 fw-bold">Address Proof:</p>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="w-100"
                                                    onClick={() => handleDownload(
                                                        `${APIURL.replace('/api', '')}${selectedMerchant.addressProof}`,
                                                        `AddressProof_${selectedMerchant.name.replace(/\s+/g, '_')}.jpg`
                                                    )}
                                                >
                                                    <i className="fas fa-download me-1"></i> Download
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Col>

                            {/* Right Column: Key Metrics & Chits */}
                            <Col md={8}>
                                <div className="bg-white p-3 rounded shadow-sm h-100">
                                    <h5 className="mb-3 pb-2 border-bottom" style={{ color: '#915200' }}>
                                        <i className="fas fa-file-invoice-dollar me-2"></i>Active Chit Plans
                                    </h5>

                                    {merchantChits.length > 0 ? (
                                        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
                                            {merchantChits.map(chit => (
                                                <div key={chit._id} className="p-3 mb-3 bg-light rounded border position-relative">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <h6 className="fw-bold text-dark mb-0">{chit.planName}</h6>
                                                        <Badge bg="secondary" className="text-white">
                                                            {chit.subscribers ? chit.subscribers.length : 0} Subscribers
                                                        </Badge>
                                                    </div>
                                                    <p className="small text-muted mb-2">{chit.description}</p>

                                                    <div className="row g-2 small">
                                                        <div className="col-6">
                                                            <div className="text-muted">Monthly</div>
                                                            <div className="fw-bold">₹{chit.monthlyAmount}</div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="text-muted">Duration</div>
                                                            <div className="fw-bold">{chit.durationMonths} Months</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5">
                                            <i className="fas fa-folder-open fa-2x text-muted mb-2"></i>
                                            <p className="text-muted small">No active chit plans found.</p>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-white">
                    {mode !== 'public' && selectedMerchant && (
                        <>
                            {selectedMerchant.status === 'Pending' && (
                                <>
                                    <Button style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }} onClick={() => { handleClose(); triggerAction(selectedMerchant, 'Approve'); }}>Approve</Button>
                                    <Button style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }} onClick={() => { handleClose(); triggerAction(selectedMerchant, 'Reject'); }}>Reject</Button>
                                </>
                            )}
                            {selectedMerchant.status === 'Approved' && (
                                <Button style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }} onClick={() => { handleClose(); triggerAction(selectedMerchant, 'Reject'); }}>Reject</Button>
                            )}
                        </>
                    )}
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                </Modal.Footer>
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
