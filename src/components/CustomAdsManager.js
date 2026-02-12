import React, { useState, useEffect } from 'react';
import { Modal, Form, Badge, Row, Col } from 'react-bootstrap';
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
                displayFrequency: 15
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

    const calculateProgress = (ad) => {
        if (!ad.startDate || !ad.endDate) return 0;
        const start = new Date(ad.startDate).getTime();
        const end = new Date(ad.endDate).getTime();
        const now = new Date().getTime();
        if (now < start) return 0;
        if (now > end) return 100;
        return Math.round(((now - start) / (end - start)) * 100);
    };

    const getDaysRemaining = (ad) => {
        if (!ad.endDate) return 0;
        const end = new Date(ad.endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    // Get the active ad (only one allowed)
    const activeAd = ads.length > 0 ? ads[0] : null;

    return (
        <div className="container-fluid py-3" style={{ minHeight: '80vh' }}>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
                    
                    .ad-master-card {
                        background: #ffffff;
                        border: 1px solid rgba(212, 175, 55, 0.15);
                        border-radius: 20px;
                        overflow: hidden;
                        position: relative;
                        box-shadow: 0 15px 40px rgba(212, 175, 55, 0.08); /* Soft gold shadow */
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }

                    .ad-master-card:hover {
                        transform: translateY(-2px);
                         box-shadow: 0 20px 50px rgba(212, 175, 55, 0.12);
                    }
                    
                    .luxury-gradient-text {
                        background: linear-gradient(135deg, #b8860b 0%, #d4af37 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        color: #d4af37;
                    }
                    
                    .glass-effect {
                        background: rgba(255, 255, 255, 0.9);
                        backdrop-filter: blur(8px);
                        border: 1px solid rgba(0, 0, 0, 0.03);
                    }
                    
                    .cta-button {
                        background: linear-gradient(90deg, #ebdc87 0%, #e2d183 100%);
                        border: 1px solid #915200;
                        color: #915200;
                        font-weight: 700;
                        padding: 0.6rem 1.4rem;
                        border-radius: 50rem;
                        transition: all 0.3s ease;
                        font-family: 'Inter', sans-serif;
                         box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);
                    }
                    
                    .cta-button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
                        background: linear-gradient(90deg, #e2d183 0%, #ebdc87 100%);
                    }

                    .image-container {
                        height: 280px;
                        border-radius: 12px;
                        overflow: hidden;
                        position: relative;
                        background: #f8f9fa;
                        box-shadow: inset 0 0 20px rgba(0,0,0,0.03);
                    }
                    
                    .image-container img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.5s ease;
                    }

                    .image-container:hover img {
                         transform: scale(1.02);
                    }

                    .progress-gold {
                        height: 8px;
                        background: #f0f0f0;
                        border-radius: 4px;
                        overflow: hidden;
                    }

                    .progress-bar-gold {
                        background: linear-gradient(90deg, #d4af37, #f4e4a6);
                        height: 100%;
                        border-radius: 4px;
                    }

                    .stat-box {
                        background: #fff;
                        border: 1px solid rgba(0,0,0,0.04);
                        border-radius: 12px;
                        padding: 12px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                        text-align: center;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }

                    /* Typography */
                    .font-serif { fontFamily: 'Playfair Display', serif; }
                    .font-sans { fontFamily: 'Inter', sans-serif; }
                    .text-dark-primary { color: #1a1a1a; }
                    .text-dark-secondary { color: #5a5a5a; }
                    
                    /* Form Overrides */
                    .form-control {
                        background-color: #fbfbfb;
                        border: 1px solid #e0e0e0;
                        color: #1a1a1a;
                        padding: 0.6rem 1rem;
                        border-radius: 8px;
                    }
                    .form-control:focus {
                        background-color: #fff;
                        border-color: #d4af37;
                        box-shadow: 0 0 0 0.25rem rgba(212, 175, 55, 0.1);
                        color: #000;
                    }
                    .form-label {
                        color: #444;
                        font-weight: 500;
                        font-size: 0.9rem;
                    }
                    
                    /* Custom Scrollbar for image list */
                     .custom-scroll::-webkit-scrollbar {
                        height: 6px;
                    }
                    .custom-scroll::-webkit-scrollbar-track {
                        background: #f1f1f1;
                    }
                    .custom-scroll::-webkit-scrollbar-thumb {
                        background: #ddd; 
                        border-radius: 3px;
                    }
                `}
            </style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #f3e9bd 0%, #ebdc87 100%)', color: '#915200' }}>
                            <i className="fas fa-ad fa-lg"></i>
                        </div>
                        <div>
                            <h5 className="fw-bold mb-0" style={{ color: '#915200' }}>My Campaigns</h5>
                            <small className="text-muted">Manage your exclusive brand promotions.</small>
                        </div>
                    </div>
                {!activeAd && (
                    <button
                        className="cta-button"
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <i className="fas fa-plus me-2"></i>New Campaign
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : !activeAd ? (
                <div className="text-center py-5 bg-white rounded-4 border border-1 shadow-sm">
                    <div className="display-4 text-warning mb-3 opacity-50">
                        <i className="fas fa-bullhorn"></i>
                    </div>
                    <h4 className="text-dark font-serif">No Active Campaign</h4>
                    <p className="text-muted small">Launch a premium advertisement to reach your audience.</p>
                </div>
            ) : (
                <div className="ad-master-card p-4">
                    <Row className="g-4 align-items-center">
                        <Col lg={5}>
                            <div className="image-container shadow-sm border border-light">
                                <img
                                    src={`${APIURL.replace('/api', '')}${activeAd.imageUrls?.[0] || activeAd.imageUrl}`}
                                    alt="Ad Visual"
                                />
                                <Badge bg={activeAd.isActive ? 'success' : 'secondary'} className="position-absolute top-2 start-2 shadow-sm">
                                    {activeAd.isActive ? 'LIVE' : 'PAUSED'}
                                </Badge>
                                {activeAd.imageUrls?.length > 1 && (
                                    <Badge bg="light" text="dark" className="position-absolute bottom-2 end-2 opacity-90 shadow-sm border">
                                        +{activeAd.imageUrls.length - 1} more
                                    </Badge>
                                )}
                            </div>
                        </Col>
                        <Col lg={7}>
                            <div className="h-100 d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h3 className="text-dark-primary fw-bold mb-2 font-serif">{activeAd.title}</h3>
                                        <p className="text-dark-secondary small mb-0 font-sans" style={{ maxWidth: '450px' }}>
                                            {activeAd.description}
                                        </p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-outline-dark btn-sm rounded-pill px-3"
                                            onClick={() => handleEditClick(activeAd)}
                                        >
                                            <i className="fas fa-pen small"></i>
                                        </button>
                                        <button
                                            className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                            onClick={() => handleDelete(activeAd._id)}
                                        >
                                            <i className="fas fa-trash small"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-4">
                                        <div className="stat-box">
                                            <small className="text-muted d-block text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Start Date</small>
                                            <span className="text-dark-primary fw-bold small">
                                                {new Date(activeAd.startDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="stat-box">
                                            <small className="text-muted d-block text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>End Date</small>
                                            <span className="text-dark-primary fw-bold small">
                                                {new Date(activeAd.endDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="stat-box">
                                            <small className="text-muted d-block text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Duration</small>
                                            <span className="text-dark-primary fw-bold small">{getDaysRemaining(activeAd)} Days Left</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted small">Campaign Progress</span>
                                        <span className="text-warning fw-bold small">{calculateProgress(activeAd)}%</span>
                                    </div>
                                    <div className="progress-gold mb-3">
                                        <div
                                            className="progress-bar-gold"
                                            style={{ width: `${calculateProgress(activeAd)}%` }}
                                        ></div>
                                    </div>

                                    <div className="d-flex gap-3">
                                        <button
                                            className={`btn flex-grow-1 py-2 fw-semibold ${activeAd.isActive ? 'btn-outline-warning text-dark' : 'cta-button'}`}
                                            style={activeAd.isActive ? { borderColor: '#d4af37' } : {}}
                                            onClick={() => handleToggleStatus(activeAd)}
                                        >
                                            <i className={`fas ${activeAd.isActive ? 'fa-pause' : 'fa-play'} me-2`}></i>
                                            {activeAd.isActive ? 'Pause Campaign' : 'Resume Campaign'}
                                        </button>
                                        {activeAd.link && (
                                            <a
                                                href={activeAd.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-outline-dark flex-grow-1 py-2"
                                            >
                                                Preview Link <i className="fas fa-external-link-alt ms-2 small"></i>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            {/* Light Themed Modal */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                size="lg"
                backdrop="static"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-dark font-serif h4">
                        {editingAd ? 'Edit Campaign' : 'New Campaign'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 pt-2">
                    <p className="text-muted small mb-4">Fill in the details below to launch your advertisement.</p>

                    <Form onSubmit={handleCreateOrUpdateAd}>
                        {error && <div className="alert alert-danger py-2 small mb-3 shadow-sm border-0">{error}</div>}

                        <div className="row g-3">
                            <div className="col-12">
                                <Form.Label>Visual Gallery (Max 5)</Form.Label>
                                <div className="d-flex gap-2 overflow-auto pb-2 p-2 rounded bg-light border custom-scroll">
                                    {existingImages.map((url, i) => (
                                        <div key={`exist-${i}`} className="position-relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                                            <img src={`${APIURL.replace('/api', '')}${url}`} alt="" className="rounded w-100 h-100 object-fit-cover shadow-sm" />
                                            <button type="button" className="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 rounded-circle shadow-sm" style={{ width: 20, height: 20, lineHeight: 1, transform: 'translate(40%, -40%)' }} onClick={() => handleRemoveExistingImage(i)}>×</button>
                                        </div>
                                    ))}
                                    {previewUrls.map((url, i) => (
                                        <div key={`new-${i}`} className="position-relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                                            <img src={url} alt="" className="rounded w-100 h-100 object-fit-cover shadow-sm" />
                                        </div>
                                    ))}
                                    {(existingImages.length + imageFiles.length < 5) && (
                                        <label className="btn btn-light d-flex flex-column align-items-center justify-content-center flex-shrink-0 border-dashed border-2" style={{ width: 80, height: 80, borderStyle: 'dashed', borderColor: '#ccc' }}>
                                            <i className="fas fa-plus text-muted mb-1"></i>
                                            <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Add New</span>
                                            <input type="file" className="d-none" accept="image/*" multiple onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-7">
                                <Form.Group>
                                    <Form.Label>Headline</Form.Label>
                                    <Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Grand Sale" />
                                </Form.Group>
                            </div>
                            <div className="col-md-5">
                                <Form.Group>
                                    <Form.Label>Link (Optional)</Form.Label>
                                    <Form.Control type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                                </Form.Group>
                            </div>
                            <div className="col-12">
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control as="textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe your campaign..." style={{ resize: 'none' }} />
                                </Form.Group>
                            </div>
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                                </Form.Group>
                            </div>
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                            <div className="text-muted small">
                                <i className="fas fa-clock text-warning me-1"></i>
                                Display Frequency: <span className="fw-semibold text-dark">15 minutes</span>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-light border" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="cta-button" disabled={uploading}>
                                    {uploading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-rocket me-2"></i>}
                                    {editingAd ? 'Save Changes' : 'Launch Campaign'}
                                </button>
                            </div>
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