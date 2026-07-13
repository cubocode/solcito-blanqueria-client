import React, { createContext, useContext, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmContext = createContext(null);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: 'Confirmar Acción',
    message: '',
    resolve: null
  });

  const showConfirm = (message, title = 'Confirmar Acción') => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        resolve
      });
    });
  };

  const handleClose = (result) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState({
      isOpen: false,
      title: 'Confirmar Acción',
      message: '',
      resolve: null
    });
  };

  return (
    <ConfirmContext.Provider value={showConfirm}>
      {children}
      <Modal 
        show={confirmState.isOpen} 
        onHide={() => handleClose(false)} 
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg"
        style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 23, 42, 0.3)' }}
      >
        <Modal.Body className="p-4 text-center">
          <div 
            className="mx-auto mb-3 d-flex align-items-center justify-content-center text-warning"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              fontSize: '1.75rem'
            }}
          >
            <FiAlertTriangle />
          </div>
          <h4 className="fw-bold mb-2" style={{ color: 'var(--primary-color)' }}>
            {confirmState.title}
          </h4>
          <p className="text-muted mb-4" style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
            {confirmState.message}
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="light" 
              onClick={() => handleClose(false)}
              className="px-4 py-2 border fw-semibold text-muted"
              style={{ borderRadius: '8px', fontSize: '0.85rem' }}
            >
              Cancelar
            </Button>
            <Button 
              variant="warning" 
              onClick={() => handleClose(true)}
              className="px-4 py-2 text-white fw-semibold border-0 shadow-sm"
              style={{ 
                borderRadius: '8px', 
                fontSize: '0.85rem',
                backgroundColor: 'var(--accent-color)'
              }}
            >
              Confirmar
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </ConfirmContext.Provider>
  );
}
