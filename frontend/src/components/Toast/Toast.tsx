import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import './Toast.scss';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType, duration?: number) => void;
    hideToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [nextId, setNextId] = useState(0);

    const showToast = useCallback((message: string, type: ToastType, duration: number = 3000) => {
        const id = nextId;
        setNextId(prev => prev + 1);
        
        setToasts(prev => [...prev, { id, message, type }]);

        if (type !== 'loading' && duration > 0) {
            setTimeout(() => {
                hideToast(id);
            }, duration);
        }
    }, [nextId]);

    const hideToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast--${toast.type}`}>
                        <span className="toast__message">{toast.message}</span>
                        {toast.type !== 'loading' && (
                            <button 
                                className="toast__close" 
                                onClick={() => hideToast(toast.id)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
