import { useState, useEffect } from 'react';
import { Card, Button, Form, ProgressBar, Alert, Badge, Spinner } from 'react-bootstrap';
import { apiFetch } from '../utils/api';

interface AgentRunnerProps {
    agentType: 'github' | 'slack' | 'notion' | 'summarize';
    agentName: string;
    repository?: string;
    branch?: string;
    onJobComplete?: (jobId: string) => void;
}

interface JobStatus {
    jobId: string;
    type: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number;
    startedAt: string;
    completedAt: string | null;
    result: any;
    error: string | null;
}

export default function AgentRunner({ agentType, agentName, repository, branch, onJobComplete }: AgentRunnerProps) {
    const [hours, setHours] = useState<number>(24);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Poll for job status
    useEffect(() => {
        if (!jobId) return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await apiFetch(`/api/agents/status/${jobId}`);
                const data = await res.json();
                setJobStatus(data);

                // Stop polling if completed or failed
                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(pollInterval);
                    // Notify parent component of completion
                    if (data.status === 'completed' && onJobComplete) {
                        onJobComplete(jobId);
                    }
                }
            } catch (err) {
                console.error('Failed to poll job status:', err);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [jobId]);

    const runAgent = async () => {
        setError(null);
        setJobId(null);
        setJobStatus(null);

        try {
            const endpoint = `/api/agent?type=${agentType}`;
            const body: any = { hours };

            if (agentType === 'github' || agentType === 'summarize') {
                body.repository = repository;
                body.branch = branch;
            } else if (agentType === 'slack') {
                body.repository = repository;
            }

            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            setJobId(data.jobId);
        } catch (err: any) {
            setError(err.message || 'Failed to start agent');
        }
    };

    const getStatusVariant = () => {
        if (!jobStatus) return 'secondary';
        switch (jobStatus.status) {
            case 'completed': return 'success';
            case 'failed': return 'danger';
            case 'running': return 'primary';
            default: return 'secondary';
        }
    };

    const renderResult = () => {
        if (!jobStatus?.result) return null;

        const result = jobStatus.result;

        return (
            <Card className="mt-4 shadow-sm">
                <Card.Header className="bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h5 className="mb-0">✨ Analysis Results</h5>
                </Card.Header>
                <Card.Body className="p-4">
                    {/* AI Summary - Featured Section */}
                    {result.ai_summary && (
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-light border-0">
                                <div className="d-flex align-items-center">
                                    <span className="fs-4 me-2">🤖</span>
                                    <h5 className="mb-0">AI-Generated Summary</h5>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {result.ai_summary.success ? (
                                    <div className="ai-summary-content">
                                        <Alert variant="info" className="mb-0 border-0" style={{
                                            background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                                            fontSize: '1.05rem',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {result.ai_summary.summary}
                                        </Alert>
                                    </div>
                                ) : (
                                    <Alert variant="warning" className="mb-0">
                                        <strong>⚠️ Summary Generation Failed:</strong> {result.ai_summary.error}
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Urgent Items (GitHub) */}
                    {result.urgent_items && result.urgent_items.length > 0 && (
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-danger text-white border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">⚠️ Urgent Items</h5>
                                    <Badge bg="light" text="dark" className="px-3 py-2">{result.urgent_items.length} items</Badge>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                                {result.urgent_items.slice(0, 10).map((item: any, idx: number) => (
                                    <Card key={idx} className="mb-3 border-start border-danger border-4">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="mb-1">
                                                    <Badge bg="danger" className="me-2">{item.type.toUpperCase()}</Badge>
                                                    #{item.number}: {item.title}
                                                </h6>
                                            </div>
                                            <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                                                <strong>Reason:</strong> {item.reason}
                                            </p>
                                        </Card.Body>
                                    </Card>
                                ))}
                                {result.urgent_items.length > 10 && (
                                    <Alert variant="light" className="mb-0 text-center">
                                        ... and {result.urgent_items.length - 10} more urgent items
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Action Items (Slack) */}
                    {result.action_items && result.action_items.length > 0 && (
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-primary text-white border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">📋 Action Items</h5>
                                    <Badge bg="light" text="dark" className="px-3 py-2">{result.action_items.length} items</Badge>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                                {result.action_items.slice(0, 10).map((item: any, idx: number) => (
                                    <Card key={idx} className="mb-2 border-start border-primary border-3">
                                        <Card.Body className="py-2">
                                            <div className="d-flex align-items-start">
                                                <Badge bg="primary" className="me-2 mt-1">{item.channel}</Badge>
                                                <div>
                                                    <strong>{item.author}:</strong> {item.text.substring(0, 200)}{item.text.length > 200 ? '...' : ''}
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                                {result.action_items.length > 10 && (
                                    <Alert variant="light" className="mb-0 text-center">
                                        ... and {result.action_items.length - 10} more action items
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Key Discussions (Slack) */}
                    {result.key_discussions && result.key_discussions.length > 0 && (
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-info text-white border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">💬 Key Discussions</h5>
                                    <Badge bg="light" text="dark" className="px-3 py-2">{result.key_discussions.length} discussions</Badge>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                                {result.key_discussions.slice(0, 5).map((disc: any, idx: number) => (
                                    <Card key={idx} className="mb-3 border-start border-info border-3">
                                        <Card.Body>
                                            <h6>
                                                <Badge bg="info" className="me-2">#{disc.channel}</Badge>
                                                {disc.topic.substring(0, 150)}{disc.topic.length > 150 ? '...' : ''}
                                            </h6>
                                            <div className="d-flex gap-3 mt-2">
                                                <small className="text-muted">
                                                    <strong>💬 {disc.reply_count}</strong> replies
                                                </small>
                                                <small className="text-muted">
                                                    <strong>👥 {disc.participants.length}</strong> participants
                                                </small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Priority Changes (Notion) */}
                    {result.priority_changes && result.priority_changes.length > 0 && (
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-warning text-dark border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">🎯 Priority Changes</h5>
                                    <Badge bg="dark" className="px-3 py-2">{result.priority_changes.length} changes</Badge>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                                {result.priority_changes.map((change: any, idx: number) => (
                                    <Card key={idx} className="mb-2 border-start border-warning border-3">
                                        <Card.Body className="py-2">
                                            <h6 className="mb-1">{change.title}</h6>
                                            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{change.reason}</p>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Raw Data Toggle - Collapsible */}
                    <Card className="border-0 bg-light">
                        <Card.Body>
                            <details>
                                <summary className="text-muted fw-bold" style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    🔍 View Raw JSON Data
                                </summary>
                                <pre className="mt-3 p-3 bg-white border rounded" style={{
                                    maxHeight: '400px',
                                    overflow: 'auto',
                                    fontSize: '0.85em',
                                    fontFamily: 'monospace'
                                }}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </details>
                        </Card.Body>
                    </Card>
                </Card.Body>
            </Card>
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <h5 className="mb-0">{agentName}</h5>
            </Card.Header>
            <Card.Body>
                <Form.Group className="mb-3">
                    <Form.Label>📅 Time Range</Form.Label>
                    <Form.Select value={hours} onChange={(e) => setHours(parseInt(e.target.value))}>
                        <option value={1}>Last 1 hour</option>
                        <option value={6}>Last 6 hours</option>
                        <option value={12}>Last 12 hours</option>
                        <option value={24}>Last 24 hours</option>
                        <option value={48}>Last 48 hours</option>
                        <option value={168}>Last week</option>
                        <option value={336}>Last 2 weeks</option>
                        <option value={720}>Last month</option>
                        <option value={2160}>Last 3 months</option>
                        <option value={4320}>Last 6 months</option>
                        <option value={8760}>Last year</option>
                        <option value={999999}>All time</option>
                    </Form.Select>
                </Form.Group>

                <Button
                    variant="primary"
                    onClick={runAgent}
                    disabled={!!jobId && jobStatus?.status === 'running'}
                    className="w-100"
                >
                    {jobId && jobStatus?.status === 'running' ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Running Agent...
                        </>
                    ) : (
                        `Run ${agentName} `
                    )}
                </Button>

                {error && (
                    <Alert variant="danger" className="mt-3 mb-0">
                        {error}
                    </Alert>
                )}

                {jobStatus && (
                    <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>Status:</span>
                            <Badge bg={getStatusVariant()}>
                                {jobStatus.status.toUpperCase()}
                            </Badge>
                        </div>

                        <ProgressBar
                            now={jobStatus.progress}
                            label={`${jobStatus.progress}%`}
                            variant={getStatusVariant()}
                            animated={jobStatus.status === 'running'}
                        />

                        {jobStatus.status === 'failed' && jobStatus.error && (
                            <Alert variant="danger" className="mt-3 mb-0">
                                <strong>Error:</strong> {jobStatus.error}
                            </Alert>
                        )}

                        {jobStatus.status === 'completed' && renderResult()}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
