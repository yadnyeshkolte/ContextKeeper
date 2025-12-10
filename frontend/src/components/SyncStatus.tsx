import { useState, useEffect } from 'react';
import './SyncStatus.css';
import BranchSelector from './BranchSelector';

interface SyncStatusData {
    chromadb: {
        count: number;
        status: string;
    };
    mongodb: string;
    timestamp: string;
}

interface SyncResult {
    success: boolean;
    total_items?: number;
    commits?: number;
    pull_requests?: number;
    issues?: number;
    readme?: number;
    timestamp?: string;
    error?: string;
}

interface SyncStatusProps {
    repository: string;
    branch: string;
    onBranchChange: (branch: string) => void;
}

const SyncStatus = ({ repository, branch, onBranchChange }: SyncStatusProps) => {
    const [status, setStatus] = useState<SyncStatusData | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/status?repository=${encodeURIComponent(repository)}&branch=${encodeURIComponent(branch)}`);
            const data = await res.json();
            setStatus(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch status:', err);
            setError('Failed to connect to backend');
        }
    };

    const triggerSync = async () => {
        setSyncing(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:3000/api/collect/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, branch })
            });
            const data: SyncResult = await res.json();

            if (data.success) {
                setLastSync(data.timestamp || new Date().toISOString());
                // Refresh status after sync
                setTimeout(fetchStatus, 1000);
            } else {
                setError(data.error || 'Sync failed');
            }
        } catch (err) {
            console.error('Sync failed:', err);
            setError('Failed to sync GitHub data');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Refresh status every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, [branch, repository]);

    return (
        <div className="sync-status">
            <BranchSelector
                repository={repository}
                selectedBranch={branch}
                onBranchChange={onBranchChange}
            />
            <div className="sync-header">
                <h3>📊 System Status</h3>
                <button
                    onClick={triggerSync}
                    disabled={syncing}
                    className="sync-button"
                >
                    {syncing ? `🔄 Syncing ${branch}...` : `🔄 Sync ${branch}`}
                </button>
            </div>

            {error && (
                <div className="sync-error">
                    ⚠️ {error}
                </div>
            )}

            <div className="status-grid">
                <div className="status-card">
                    <div className="status-label">ChromaDB Documents</div>
                    <div className="status-value">
                        {status?.chromadb?.count || 0}
                    </div>
                    <div className="status-indicator">
                        {status?.chromadb?.status === 'ok' ? '🟢 Connected' : '🔴 Error'}
                    </div>
                </div>

                <div className="status-card">
                    <div className="status-label">MongoDB</div>
                    <div className="status-value">
                        {status?.mongodb === 'connected' ? 'Connected' : 'Disconnected'}
                    </div>
                    <div className="status-indicator">
                        {status?.mongodb === 'connected' ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                </div>

                <div className="status-card">
                    <div className="status-label">Last Sync</div>
                    <div className="status-value">
                        {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                    </div>
                    <div className="status-indicator">
                        {lastSync ? '✅ Synced' : '⏳ Pending'}
                    </div>
                </div>
            </div>

            {syncing && (
                <div className="sync-progress">
                    <div className="progress-bar">
                        <div className="progress-fill"></div>
                    </div>
                    <p>Fetching data from GitHub repository...</p>
                </div>
            )}
        </div>
    );
};

export default SyncStatus;
