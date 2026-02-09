import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Badge, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { APIURL } from '../utils/Function';
import CustomWebAlert from './CustomWebAlert';

const CustomAdsManager = ({ user }) => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [editingAd, setEditingAd] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [displayFrequency, setDisplayFrequency] = useState(15);
    const [error, setError] = useState('');

    // Alert State
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { },
        confirmText: 'OK'
    });

    const fetchAds = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${APIURL}/ads/my-ads`, config);
            setAds(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.token) fetchAds();
        // eslint-disable-next-line
    }, [user]);

    const showAlert = (title, message, type = 'info', onConfirm = null, confirmText = 'OK') => {
        setAlertConfig({
            show: true,
            title,
            message,
            type,
            onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, show: false }))),
            confirmText
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + existingImages.length > 5) {
            setError('Max 5 images allowed total');
            return;
        }
        setImageFiles(files);
        setPreviewUrls(files.map(file => URL.createObjectURL(file)));
    };

    const handleEditClick = (ad) => {
        setEditingAd(ad);
        setLink(ad.link || '');
        setTitle(ad.title || '');
        setDescription(ad.description || '');
        setStartDate(ad.startDate.split('T')[0]);
        setEndDate(ad.endDate.split('T')[0]);
        setDisplayFrequency(ad.displayFrequency || 15);
        setExistingImages(ad.imageUrls || [ad.imageUrl]);
        setImageFiles([]);
        setPreviewUrls([]);
        setShowModal(true);
    };

    const handleCreateOrUpdateAd = async (e) => {
        e.preventDefault();
        setError('');

        if (imageFiles.length === 0 && existingImages.length === 0) {
            setError('Please provide at least one image');
            return;
        }

        setUploading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            let finalImageUrls = [...existingImages];

            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach(file => {
                    formData.append('images', file);
                });

                const uploadConfig = {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${user.token}`
                    }
                };

                const { data: uploadedPaths } = await axios.post(`${APIURL}/upload/multiple`, formData, uploadConfig);
                finalImageUrls = [...finalImageUrls, ...uploadedPaths];
            }

            const adData = {
                imageUrls: finalImageUrls,
                link,
                title,
                description,
                startDate,
                endDate,
                displayFrequency
            };

            if (editingAd) {
                await axios.put(`${APIURL}/ads/${editingAd._id}`, adData, config);
                showAlert('Success', 'Campaign updated successfully!', 'success');
            } else {
                await axios.post(`${APIURL}/ads`, adData, config);
                showAlert('Success', 'New campaign launched successfully!', 'success');
            }

            setShowModal(false);
            resetForm();
            fetchAds();

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save ad');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setEditingAd(null);
        setImageFiles([]);
        setPreviewUrls([]);
        setExistingImages([]);
        setLink('');
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setDisplayFrequency(15);
        setError('');
    };

    const handleRemoveExistingImage = (index) => {
        const updated = existingImages.filter((_, i) => i !== index);
        setExistingImages(updated);
    };

    const handleToggleStatus = async (ad) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.patch(`${APIURL}/ads/${ad._id}/status`, {}, config);
            fetchAds();
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to update status', 'error');
        }
    };

    const handleDelete = (id) => {
        setAlertConfig({
            show: true,
            title: 'Delete Campaign?',
            message: 'Are you sure you want to delete this ad campaign? This action cannot be undone.',
            type: 'warning',
            confirmText: 'Delete Now',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, show: false }));
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    await axios.delete(`${APIURL}/ads/${id}`, config);
                    setAds(ads.filter(a => a._id !== id));
                } catch (err) {
                    console.error(err);
                    showAlert('Error', 'Failed to delete ad', 'error');
                }
            }
        });
    };

    return (
        <div className="container-fluid py-4" style={{ minHeight: '80vh' }}>
            <style>
                {`
                    .ad-card {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        border: 1px solid rgba(212, 175, 55, 0.1) !important;
                    }
                    .ad-card:hover {
                        transform: translateY(-8px);
                        box-shadow: 0 15px 35px rgba(212, 175, 55, 0.15) !important;
                    }
                    .gold-gradient-btn {
                        background: linear-gradient(90deg, #ebdc87 0%, #e2d183 100%) !important;
                        border: 1px solid #915200 !important;
                        color: #915200 !important;
                        transition: all 0.3s ease;
                    }
                    .gold-gradient-btn:hover {
                        transform: scale(1.05);
                        opacity: 0.95;
                        box-shadow: 0 5px 15px rgba(145, 82, 0, 0.2);
                    }
                    .glass-modal .modal-content {
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(212, 175, 55, 0.2);
                    }
                    .custom-badge-active {
                        background: linear-gradient(45deg, #059669, #10b981);
                        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
                    }
                    .custom-badge-inactive {
                        background: linear-gradient(45deg, #4b5563, #6b7280);
                    }
                    .extra-small {
                        font-size: 0.75rem !important;
                    }
                `}
            </style>

            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h5 className="fw-bold mb-0" style={{ color: '#915200' }}>Ad Campaigns</h5>
                    <p className="text-muted extra-small mb-0">Manage your custom promotions and customer reach</p>
                </div>
                {ads.length === 0 && (
                    <Button
                        className="gold-gradient-btn px-3 py-1.5 rounded-pill fw-bold shadow-sm d-flex align-items-center small"
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <i className="fas fa-plus-circle me-1 fs-6"></i> Create New
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#d4af37' }} />
                    <p className="mt-3 text-muted">Retrieving your campaigns...</p>
                </div>
            ) : ads.length === 0 ? (
                <Card className="text-center py-5 border-0 rounded-4 shadow-sm bg-white overflow-hidden position-relative">
                    <div className="position-absolute opacity-10" style={{ top: '-20%', right: '-10%', fontSize: '15rem', transform: 'rotate(-15deg)' }}>
                        <i className="fas fa-ad"></i>
                    </div>
                    <Card.Body className="py-5 position-relative z-1">
                        <div className="mb-4 bg-light d-inline-block rounded-circle p-4">
                            <i className="fas fa-bullhorn fa-4x" style={{ color: '#d4af37' }}></i>
                        </div>
                        <h4 className="fw-bold">No Campaigns Active</h4>
                        <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
                            You haven't created any custom ads yet. Launch a campaign today to boost your visibility and engagement!
                        </p>
                        <Button className="gold-gradient-btn rounded-pill px-4" onClick={() => setShowModal(true)}>
                            Get Started Now
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {ads.map(ad => (
                        <Col key={ad._id}>
                            <Card className="ad-card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                                <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                                    <div className="position-absolute w-100 h-100 z-1" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))' }}></div>
                                    <Card.Img
                                        variant="top"
                                        src={`${APIURL.replace('/api', '')}${ad.imageUrls?.[0] || ad.imageUrl}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />

                                    <div className="position-absolute top-0 start-0 m-2 z-2">
                                        <Badge style={{ fontSize: '0.65rem' }} className={`rounded-pill px-2 py-1 shadow-sm border-0 ${ad.isActive ? 'custom-badge-active' : 'custom-badge-inactive'}`}>
                                            {ad.isActive ? 'LIVE' : 'PAUSED'}
                                        </Badge>
                                    </div>

                                    {ad.imageUrls?.length > 1 && (
                                        <div className="position-absolute top-0 end-0 m-2 z-2">
                                            <Badge bg="dark" style={{ fontSize: '0.65rem' }} className="rounded-pill opacity-75 d-flex align-items-center gap-1">
                                                <i className="fas fa-images"></i> {ad.imageUrls.length}
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="position-absolute bottom-0 start-0 m-2 z-2 text-white">
                                        <span className="fw-bold extra-small"><i className="fas fa-clock me-1"></i>Every {ad.displayFrequency || 15}m</span>
                                    </div>
                                </div>

                                <Card.Body className="p-3">
                                    <h6 className="fw-bold mb-1 text-dark text-truncate">{ad.title || 'Special Promotion'}</h6>
                                    <p className="text-secondary mb-2 text-truncate small">
                                        {ad.description || 'Premium jewelry collections.'}
                                    </p>

                                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                                        <div className="text-start">
                                            <small className="text-muted d-block extra-small text-uppercase fw-bold">Starts</small>
                                            <span className="fw-bold extra-small">{new Date(ad.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="text-end">
                                            <small className="text-muted d-block extra-small text-uppercase fw-bold">Ends</small>
                                            <span className="fw-bold extra-small">{new Date(ad.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    <div className="d-flex gap-1 mt-auto">
                                        <Button
                                            variant="outline-dark"
                                            className="flex-grow-1 rounded-pill fw-bold border-1 py-1 extra-small"
                                            onClick={() => handleEditClick(ad)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant={ad.isActive ? 'outline-warning' : 'outline-success'}
                                            onClick={() => handleToggleStatus(ad)}
                                            className="rounded-pill px-2 py-1 extra-small fw-bold"
                                        >
                                            {ad.isActive ? 'Pause' : 'Play'}
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            className="rounded-pill px-2 py-1 extra-small fw-bold"
                                            onClick={() => handleDelete(ad._id)}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Create/Edit Ad Modal */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                backdrop="static"
                size="lg"
                className="glass-modal"
            >
                <Modal.Header closeButton className="border-0 px-4 pt-3 pb-0">
                    <Modal.Title className="fw-bold fs-5">
                        {editingAd ? 'Refine Campaign' : 'New Campaign'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4 pt-2">
                    {error && <div className="alert alert-danger border-0 rounded-3 shadow-sm py-2 mb-4 d-flex align-items-center">
                        <i className="fas fa-exclamation-circle me-2"></i> {error}
                    </div>}

                    <Form onSubmit={handleCreateOrUpdateAd}>
                        <Row className="g-3">
                            <Col lg={12}>
                                <div className="bg-light p-3 rounded-3 border">
                                    <Form.Label className="extra-small fw-bold mb-2 d-flex align-items-center text-dark">
                                        <i className="fas fa-images me-2 text-warning"></i> Imagery (Up to 5)
                                    </Form.Label>

                                    <div className="d-flex flex-wrap gap-2 mb-2">
                                        {/* Existing Images */}
                                        {existingImages.map((url, i) => (
                                            <div key={`exist-${i}`} className="position-relative rounded-3 overflow-hidden border-2 border-white shadow-sm" style={{ width: 60, height: 60 }}>
                                                <img src={`${APIURL.replace('/api', '')}${url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div
                                                    className="position-absolute top-0 end-0 bg-danger text-white d-flex align-items-center justify-content-center shadow"
                                                    style={{ width: 18, height: 18, cursor: 'pointer', borderRadius: '0 0 0 8px' }}
                                                    onClick={() => handleRemoveExistingImage(i)}
                                                >
                                                    <small style={{ fontSize: '10px' }} className="fw-bold">×</small>
                                                </div>
                                            </div>
                                        ))}

                                        {/* New Previews */}
                                        {previewUrls.map((url, i) => (
                                            <div key={i} className="rounded-3 overflow-hidden border-2 border-white shadow-sm" style={{ width: 60, height: 60 }}>
                                                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ))}

                                        {(existingImages.length + imageFiles.length < 5) && (
                                            <label className="border-2 border-dashed border-warning rounded-3 d-flex flex-column align-items-center justify-content-center cursor-pointer shadow-sm hover-bg-light transition" style={{ width: 60, height: 60, cursor: 'pointer' }}>
                                                <i className="fas fa-plus text-warning extra-small"></i>
                                                <input type="file" className="d-none" accept="image/*" multiple onChange={handleFileChange} />
                                            </label>
                                        )}
                                    </div>
                                    <small className="text-muted fst-italic extra-small">Landscape images work best.</small>
                                </div>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-dark">Headline</Form.Label>
                                    <Form.Control
                                        className="rounded-3 border-light shadow-sm py-1.5 small"
                                        type="text"
                                        placeholder="Headline"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-dark">Freq (Mins)</Form.Label>
                                    <InputGroup size="sm">
                                        <InputGroup.Text className="bg-white border-light shadow-sm"><i className="fas fa-clock text-warning"></i></InputGroup.Text>
                                        <Form.Control
                                            className="rounded-end-3 border-light shadow-sm py-1.5"
                                            type="number"
                                            placeholder="15"
                                            value={displayFrequency}
                                            onChange={(e) => setDisplayFrequency(e.target.value)}
                                            min="1"
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            <Col lg={12}>
                                <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-dark">Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        className="rounded-3 border-light shadow-sm small"
                                        placeholder="Description..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>

                            <Col lg={12}>
                                <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-dark">Target Link</Form.Label>
                                    <Form.Control
                                        className="rounded-3 border-light shadow-sm py-1.5 small"
                                        type="text"
                                        placeholder="URL"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-dark">Start</Form.Label>
                                    <Form.Control
                                        className="rounded-3 border-light shadow-sm py-1.5 small"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-dark">End</Form.Label>
                                    <Form.Control
                                        className="rounded-3 border-light shadow-sm py-1.5 small"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-grid mt-4">
                            <Button
                                type="submit"
                                disabled={uploading}
                                className="gold-gradient-btn fw-bold py-2.5 rounded-pill shadow w-100"
                            >
                                {uploading ? (
                                    <><Spinner size="sm" animation="border" className="me-2" /> Launching...</>
                                ) : (
                                    <>
                                        <i className={`fas ${editingAd ? 'fa-check-circle' : 'fa-rocket'} me-2`}></i>
                                        {editingAd ? 'Update Campaign Details' : 'Launch New Campaign'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <CustomWebAlert
                show={alertConfig.show}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.type === 'warning' ? () => setAlertConfig(prev => ({ ...prev, show: false })) : null}
            />
        </div>
    );
};

export default CustomAdsManager;
