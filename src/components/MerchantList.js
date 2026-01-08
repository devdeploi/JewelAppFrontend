import React, { useState, useEffect } from 'react';
import { Table, Badge, Modal, Button, Row, Col, Card, Pagination } from 'react-bootstrap';
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
    const [filters, setFilters] = useState({ status: mode === 'public' ? 'Approved' : '', search: '' });

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
                <h4 className="text-secondary mb-0">
                    <i className="fas fa-store me-2"></i>
                    Merchant Directory
                </h4>
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
                                                <Button size="sm" variant="danger" className="text-white p-0 ms-2" onClick={() => triggerAction(merchant, 'Delete')}>
                                                    <i className="fas fa-trash"></i>
                                                </Button>
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
            <Modal show={showModal} onHide={handleClose} size="lg" centered scrollable>
                {selectedMerchant && (
                    <>
                        <Modal.Header className="border-0 pb-0">
                            <Modal.Title className="fw-bold" style={{ color: '#915200' }}>
                                <i className="fas fa-store me-2"></i>
                                {selectedMerchant.name}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="p-4">
                            {/* Images Gallery */}
                            {selectedMerchant.shopImages && selectedMerchant.shopImages.length > 0 && (
                                <div className="d-flex gap-2 mb-4 overflow-auto">
                                    {selectedMerchant.shopImages.map((img, i) => (
                                        <img key={i} src={`${APIURL.replace('/api', '')}${img}`} alt="Shop" style={{ height: 150, borderRadius: 8 }} />
                                    ))}
                                </div>
                            )}

                            {/* Profile Details */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="text-secondary text-uppercase small fw-bold">Contact Info</h6>
                                    <p className="mb-1"><strong>Email:</strong> {selectedMerchant.email}</p>
                                    <p className="mb-1"><strong>Phone:</strong> {selectedMerchant.phone || 'N/A'}</p>
                                    <p className="mb-1"><strong>Address:</strong> {selectedMerchant.address || 'N/A'}</p>
                                    {/* Don't show PayPal for public maybe? Safe to show if users need to pay? Actually users pay via App flow usually, better hide PayPal email from public view to avoid spam */}
                                    {/* {mode !== 'public' && <p className="mb-0"><strong>PayPal:</strong> {selectedMerchant.paypalEmail || 'N/A'}</p>} */}
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-secondary text-uppercase small fw-bold">Account Details</h6>
                                    <p className="mb-1"><strong>Plan:</strong> {selectedMerchant.plan}</p>
                                    {mode !== 'public' && <p className="mb-1"><strong>Status:</strong> <span className={`text-${selectedMerchant.status === 'Approved' ? 'success' : 'warning'}`}>{selectedMerchant.status}</span></p>}
                                    <p className="mb-0"><strong>Joined:</strong> {new Date(selectedMerchant.createdAt).toLocaleDateString()}</p>
                                </Col>
                                <Col md={12} className="mt-3">
                                    <h6 className="text-secondary text-uppercase small fw-bold">GSTIN & Verification</h6>
                                    <p className="mb-1"><strong>GSTIN:</strong> {selectedMerchant.gstin || 'N/A'}</p>
                                    {selectedMerchant.addressProof ? (
                                        <div className="mt-2">
                                            <p className="mb-1 fw-bold small">Address Proof:</p>
                                            <div className="d-flex align-items-center gap-3">
                                                <img
                                                    src={`${APIURL.replace('/api', '')}${selectedMerchant.addressProof}`}
                                                    alt="Address Proof"
                                                    style={{ height: 80, borderRadius: 6, border: '1px solid #dee2e6' }}
                                                />
                                                <Button
                                                    variant="outline-dark"
                                                    size="sm"
                                                    onClick={() => handleDownload(
                                                        `${APIURL.replace('/api', '')}${selectedMerchant.addressProof}`,
                                                        `AddressProof_${selectedMerchant.name.replace(/\s+/g, '_')}.jpg`
                                                    )}
                                                >
                                                    <i className="fas fa-download me-1"></i> Download
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted small">No address proof uploaded.</p>
                                    )}
                                </Col>
                            </Row>

                            <hr className="text-muted opacity-25" />

                            {/* Chit Plans List */}
                            <h5 className="mb-3" style={{ color: '#915200' }}>
                                <i className="fas fa-file-invoice-dollar me-2"></i>
                                Active Chit Plans
                            </h5>

                            {merchantChits.length > 0 ? (
                                <Row className="g-3">
                                    {merchantChits.map(chit => (
                                        <Col md={12} key={chit._id}>
                                            <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: '#e5e5e5' }}>
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="fw-bold mb-0 text-dark">{chit.planName}</h6>
                                                    </div>
                                                    <p className="small text-muted mb-2">{chit.description}</p>
                                                    <div className="d-flex justify-content-between small">
                                                        <span><strong>Amount:</strong> ₹{chit.monthlyAmount}/mo</span>
                                                        <span><strong>Duration:</strong> {chit.durationMonths} months</span>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <div className="text-center py-4 bg-light rounded">
                                    <p className="text-muted mb-0">No active chit plans found for this merchant.</p>
                                </div>
                            )}

                        </Modal.Body>
                        <Modal.Footer className="border-0 pt-0">
                            {mode !== 'public' && (
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
                                    {/* <Button variant="danger" onClick={() => { handleClose(); triggerAction(selectedMerchant, 'Delete'); }}>Delete</Button> */}
                                </>
                            )}
                            <Button variant="secondary" onClick={handleClose}>Close</Button>
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            {/* Confirmation Modal */}
            <Modal show={confirmation.show} onHide={() => !actionLoading && setConfirmation({ ...confirmation, show: false })} centered backdrop={actionLoading ? 'static' : true} keyboard={!actionLoading}>
                {!actionLoading ? (
                    <>
                        <Modal.Header closeButton className="border-0">
                            <Modal.Title style={{ color: '#915200' }}>Confirm Action</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="py-4">
                            <p className="mb-0">Are you sure you want to <strong>{confirmation.action}</strong> merchant <strong style={{ color: '#915200' }}>{confirmation.merchantName}</strong>?</p>
                            {confirmation.action === 'Delete' && <p className="text-danger fw-bold small mt-2"><i className="fas fa-exclamation-triangle me-1"></i> This action cannot be undone.</p>}
                        </Modal.Body>
                        <Modal.Footer className="border-0 pt-0">
                            <Button variant="outline-secondary" onClick={() => setConfirmation({ ...confirmation, show: false })}>Cancel</Button>
                            <Button
                                style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }}
                                onClick={executeAction}
                            >
                                Yes, {confirmation.action}
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
