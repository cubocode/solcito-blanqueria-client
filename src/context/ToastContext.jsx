import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container-custom">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card-custom toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && <FiCheckCircle />}
              {toast.type === 'error' && <FiXCircle />}
              {toast.type === 'warning' && <FiAlertTriangle />}
              {toast.type === 'info' && <FiInfo />}
            </div>
            <div className="toast-content">{toast.message}</div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <FiX />
            </button>
            <div 
              className="toast-progress-bar" 
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.showToast;
}
