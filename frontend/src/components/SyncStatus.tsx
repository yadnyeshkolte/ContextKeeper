import { useState, useEffect } from 'react';
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
    synced_count?: number;
    total_branches?: number;
}

interface SyncStatusProps {
    repository: string;
    branch: string;
    onBranchChange: (branch: string) => void;
}

const SyncStatus = ({ repository, branch, onBranchChange }: SyncStatusProps) => {
    const [status, setStatus] = useState<SyncStatusData | null>(null);
    const [syncingData, setSyncingData] = useState(false);
    const [syncingRepo, setSyncingRepo] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isFetchingStatus, setIsFetchingStatus] = useState(false);

    const fetchStatus = async (showLoading = true) => {
        if (showLoading) {
            setIsFetchingStatus(true);
        }
        try {
            const res = await fetch(`http://localhost:3000/api/status?repository=${encodeURIComponent(repository)}&branch=${encodeURIComponent(branch)}`);
            const data = await res.json();
            setStatus(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch status:', err);
            setError('Failed to connect to backend');
        } finally {
            if (showLoading) {
                setIsFetchingStatus(false);
            }
        }
    };

    const triggerSyncData = async () => {
        setSyncingData(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await fetch('http://localhost:3000/api/sync-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, branch })
            });
            const data: SyncResult = await res.json();

            if (data.success) {
                setLastSync(data.timestamp || new Date().toISOString());
                setSuccessMessage(`Synced ${data.total_items || 0} items from ${branch}`);
                setTimeout(() => fetchStatus(false), 1000);
            } else {
                setError(data.error || 'Sync failed');
            }
        } catch (err) {
            console.error('Sync failed:', err);
            setError('Failed to sync data');
        } finally {
            setSyncingData(false);
        }
    };

    const triggerSyncRepo = async () => {
        setSyncingRepo(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await fetch('http://localhost:3000/api/sync-repo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository })
            });
            const data: SyncResult = await res.json();

            if (data.success) {
                setLastSync(data.timestamp || new Date().toISOString());
                setSuccessMessage(`Synced ${data.synced_count || 0} of ${data.total_branches || 0} branches`);
                setTimeout(() => fetchStatus(false), 1000);
            } else {
                setError(data.error || 'Repository sync failed');
            }
        } catch (err) {
            console.error('Repository sync failed:', err);
            setError('Failed to sync repository');
        } finally {
            setSyncingRepo(false);
        }
    };

    useEffect(() => {
        fetchStatus(true);
        const interval = setInterval(() => fetchStatus(false), 30000);
        return () => clearInterval(interval);
    }, [branch, repository]);

    return (
        <div className="glass-card p-6 mb-6 animate-fade-in">
            <BranchSelector
                repository={repository}
                selectedBranch={branch}
                onBranchChange={onBranchChange}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    📊 System Status
                </h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={triggerSyncData}
                        disabled={syncingData || syncingRepo}
                        className="btn-primary text-sm flex items-center gap-2"
                    >
                        {syncingData ? (
                            <>
                                <span className="spinner"></span>
                                Syncing {branch}...
                            </>
                        ) : (
                            `🔄 Sync Data (${branch})`
                        )}
                    </button>
                    <button
                        onClick={triggerSyncRepo}
                        disabled={syncingData || syncingRepo}
                        className="btn-success text-sm flex items-center gap-2"
                    >
                        {syncingRepo ? (
                            <>
                                <span className="spinner"></span>
                                Syncing All...
                            </>
                        ) : (
                            '🔄 Sync Repo (All Branches)'
                        )}
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {isFetchingStatus && (
                <div className="alert-info mb-4">
                    <span className="spinner"></span>
                    <span>Fetching from local ChromaDB...</span>
                </div>
            )}

            {error && (
                <div className="alert-danger mb-4 flex justify-between items-start">
                    <span>⚠️ {error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-rose-700 dark:text-rose-300 hover:text-rose-900 font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {successMessage && (
                <div className="alert-success mb-4 flex justify-between items-start">
                    <span>✅ {successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Status Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* ChromaDB Status */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ChromaDB Documents</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {status?.chromadb?.count || 0}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={status?.chromadb?.status === 'ok' ? 'status-dot-success' : 'status-dot-danger'}></span>
                        <span className={`text-sm font-medium ${status?.chromadb?.status === 'ok'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                            {status?.chromadb?.status === 'ok' ? 'Connected' : 'Error'}
                        </span>
                    </div>
                </div>

                {/* MongoDB Status */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">MongoDB</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {status?.mongodb === 'connected' ? 'Connected' : 'Disconnected'}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={status?.mongodb === 'connected' ? 'status-dot-success' : 'status-dot-danger'}></span>
                        <span className={`text-sm font-medium ${status?.mongodb === 'connected'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                            {status?.mongodb === 'connected' ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {/* Last Sync Status */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Sync</div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={lastSync ? 'status-dot-success' : 'status-dot-warning'}></span>
                        <span className={`text-sm font-medium ${lastSync
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                            {lastSync ? 'Synced' : 'Pending'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Syncing Indicator */}
            {(syncingData || syncingRepo) && (
                <div className="mt-4 text-center py-6">
                    <div className="spinner-lg text-primary-500"></div>
                    <p className="mt-3 text-gray-600 dark:text-gray-400">
                        {syncingRepo
                            ? 'Fetching and syncing all branches from repository...'
                            : 'Fetching data from GitHub...'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SyncStatus;
