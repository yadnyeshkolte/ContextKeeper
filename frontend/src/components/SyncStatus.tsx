import { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner, Row, Col } from 'react-bootstrap';
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
                // Refresh status after sync
                setTimeout(fetchStatus, 1000);
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
                // Refresh status after sync
                setTimeout(fetchStatus, 1000);
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
        fetchStatus();
        // Refresh status every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, [branch, repository]);

    return (
        <Card className="mb-4">
            <Card.Body>
                <BranchSelector
                    repository={repository}
                    selectedBranch={branch}
                    onBranchChange={onBranchChange}
                />

                <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
                    <h5 className="mb-0">📊 System Status</h5>
                    <div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={triggerSyncData}
                            disabled={syncingData || syncingRepo}
                            className="me-2"
                        >
                            {syncingData ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Syncing {branch}...
                                </>
                            ) : (
                                `🔄 Sync Data (${branch})`
                            )}
                        </Button>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={triggerSyncRepo}
                            disabled={syncingData || syncingRepo}
                        >
                            {syncingRepo ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Syncing All Branches...
                                </>
                            ) : (
                                '🔄 Sync Repo (All Branches)'
                            )}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        ⚠️ {error}
                    </Alert>
                )}

                {successMessage && (
                    <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
                        ✅ {successMessage}
                    </Alert>
                )}

                <Row className="g-3">
                    <Col md={4}>
                        <Card bg="light">
                            <Card.Body>
                                <div className="text-muted small">ChromaDB Documents</div>
                                <h3 className="mb-1">{status?.chromadb?.count || 0}</h3>
                                <Badge bg={status?.chromadb?.status === 'ok' ? 'success' : 'danger'}>
                                    {status?.chromadb?.status === 'ok' ? '🟢 Connected' : '🔴 Error'}
                                </Badge>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card bg="light">
                            <Card.Body>
                                <div className="text-muted small">MongoDB</div>
                                <h3 className="mb-1">
                                    {status?.mongodb === 'connected' ? 'Connected' : 'Disconnected'}
                                </h3>
                                <Badge bg={status?.mongodb === 'connected' ? 'success' : 'danger'}>
                                    {status?.mongodb === 'connected' ? '🟢 Active' : '🔴 Inactive'}
                                </Badge>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card bg="light">
                            <Card.Body>
                                <div className="text-muted small">Last Sync</div>
                                <h6 className="mb-1">
                                    {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                                </h6>
                                <Badge bg={lastSync ? 'success' : 'warning'}>
                                    {lastSync ? '✅ Synced' : '⏳ Pending'}
                                </Badge>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {(syncingData || syncingRepo) && (
                    <div className="mt-3 text-center">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">
                            {syncingRepo ? 'Fetching and syncing all branches from repository...' : 'Fetching data from GitHub...'}
                        </p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default SyncStatus;
