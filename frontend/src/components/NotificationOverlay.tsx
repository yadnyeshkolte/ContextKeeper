import React from 'react';
import './NotificationOverlay.css';

interface NotificationOverlayProps {
    message: string;
    onFetch: () => void;
    onDismiss: () => void;
}

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ message, onFetch, onDismiss }) => {
    return (
        <div className="notification-overlay">
            <div className="notification-content">
                <div className="notification-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
                    </svg>
                </div>
                <div className="notification-message">
                    <h4>Updates Available</h4>
                    <p>{message}</p>
                </div>
                <div className="notification-actions">
                    <button className="btn-fetch" onClick={onFetch}>
                        Fetch Updates
                    </button>
                    <button className="btn-dismiss" onClick={onDismiss}>
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationOverlay;
