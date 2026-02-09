import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const CustomWebAlert = ({ show, title, message, type, onConfirm, onCancel, confirmText, cancelText }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <i className="fas fa-check-circle text-success mb-3" style={{ fontSize: '3rem' }}></i>;
            case 'error': return <i className="fas fa-times-circle text-danger mb-3" style={{ fontSize: '3rem' }}></i>;
            case 'warning': return <i className="fas fa-exclamation-triangle text-warning mb-3" style={{ fontSize: '3rem' }}></i>;
            default: return <i className="fas fa-info-circle text-primary mb-3" style={{ fontSize: '3rem' }}></i>;
        }
    };

    return (
        <Modal
            show={show}
            onHide={onCancel}
            centered
            contentClassName="rounded-4 border-0 shadow-lg"
            size="sm"
        >
            <Modal.Body className="text-center p-4">
                {getIcon()}
                <h4 className="fw-bold mb-2">{title}</h4>
                <p className="text-muted mb-4">{message}</p>
                <div className="d-flex gap-2 justify-content-center">
                    {onCancel && (
                        <Button
                            variant="light"
                            className="rounded-pill px-4 fw-bold"
                            onClick={onCancel}
                        >
                            {cancelText || 'Cancel'}
                        </Button>
                    )}
                    <Button
                        style={{ background: 'linear-gradient(45deg, #d4af37, #b7791f)', border: 'none' }}
                        className="rounded-pill px-4 fw-bold text-white shadow-sm"
                        onClick={onConfirm}
                    >
                        {confirmText || 'Confirm'}
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default CustomWebAlert;
