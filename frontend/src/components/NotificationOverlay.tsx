import React from 'react';

interface NotificationOverlayProps {
    message: string;
    onFetch: () => void;
    onDismiss: () => void;
}

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ message, onFetch, onDismiss }) => {
    return (
        <div className="fixed top-5 right-5 z-50 animate-slide-in-right">
            <div className="bg-gradient-primary text-white p-5 rounded-xl shadow-glass-lg backdrop-blur-md flex items-center gap-4 max-w-md">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-base mb-1">Updates Available</h4>
                    <p className="text-sm text-white/90">{message}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onFetch}
                        className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-all hover:-translate-y-0.5"
                    >
                        Fetch Updates
                    </button>
                    <button
                        onClick={onDismiss}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium text-sm hover:bg-white/30 transition-all"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationOverlay;
