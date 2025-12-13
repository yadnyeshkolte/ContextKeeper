import { useState, useEffect } from 'react';
import { Card, Button, Form, ProgressBar, Alert, Badge, Spinner } from 'react-bootstrap';

interface AgentRunnerProps {
    agentType: 'github' | 'slack' | 'notion' | 'summarize';
    agentName: string;
    repository?: string;
    branch?: string;
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

export default function AgentRunner({ agentType, agentName, repository, branch }: AgentRunnerProps) {
    const [hours, setHours] = useState<number>(24);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Poll for job status
    useEffect(() => {
        if (!jobId) return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/agents/status/${jobId}`);
                const data = await res.json();
                setJobStatus(data);

                // Stop polling if completed or failed
                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(pollInterval);
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
            const endpoint = `http://localhost:3000/api/agents/${agentType}`;
            const body: any = { hours };

            if (agentType === 'github' || agentType === 'summarize') {
                body.repository = repository;
                body.branch = branch;
            } else if (agentType === 'slack') {
                body.repository = repository;
            }

            const res = await fetch(endpoint, {
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
            <Card className="mt-3">
                <Card.Header className="bg-light">
                    <strong>Results</strong>
                </Card.Header>
                <Card.Body>
                    {/* AI Summary */}
                    {result.ai_summary && (
                        <div className="mb-3">
                            <h6>AI Summary</h6>
                            <Alert variant={result.ai_summary.success ? 'info' : 'warning'}>
                                {result.ai_summary.summary || result.ai_summary.error}
                            </Alert>
                        </div>
                    )}

                    {/* Urgent Items (GitHub) */}
                    {result.urgent_items && result.urgent_items.length > 0 && (
                        <div className="mb-3">
                            <h6>⚠️ Urgent Items ({result.urgent_items.length})</h6>
                            {result.urgent_items.slice(0, 5).map((item: any, idx: number) => (
                                <Alert key={idx} variant="warning" className="py-2">
                                    <strong>{item.type.toUpperCase()} #{item.number}:</strong> {item.title}
                                    <br />
                                    <small className="text-muted">{item.reason}</small>
                                </Alert>
                            ))}
                        </div>
                    )}

                    {/* Action Items (Slack) */}
                    {result.action_items && result.action_items.length > 0 && (
                        <div className="mb-3">
                            <h6>📋 Action Items ({result.action_items.length})</h6>
                            {result.action_items.slice(0, 5).map((item: any, idx: number) => (
                                <div key={idx} className="mb-2">
                                    <Badge bg="info">{item.channel}</Badge>{' '}
                                    <strong>{item.author}:</strong> {item.text.substring(0, 100)}...
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Key Discussions (Slack) */}
                    {result.key_discussions && result.key_discussions.length > 0 && (
                        <div className="mb-3">
                            <h6>💬 Key Discussions ({result.key_discussions.length})</h6>
                            {result.key_discussions.slice(0, 3).map((disc: any, idx: number) => (
                                <Alert key={idx} variant="light" className="py-2">
                                    <strong>#{disc.channel}:</strong> {disc.topic.substring(0, 100)}...
                                    <br />
                                    <small>{disc.reply_count} replies from {disc.participants.length} participants</small>
                                </Alert>
                            ))}
                        </div>
                    )}

                    {/* Priority Changes (Notion) */}
                    {result.priority_changes && result.priority_changes.length > 0 && (
                        <div className="mb-3">
                            <h6>🎯 Priority Changes ({result.priority_changes.length})</h6>
                            {result.priority_changes.map((change: any, idx: number) => (
                                <Alert key={idx} variant="warning" className="py-2">
                                    <strong>{change.title}</strong>
                                    <br />
                                    <small className="text-muted">{change.reason}</small>
                                </Alert>
                            ))}
                        </div>
                    )}

                    {/* Raw Data Toggle */}
                    <details className="mt-3">
                        <summary className="text-muted" style={{ cursor: 'pointer' }}>
                            View Raw Data
                        </summary>
                        <pre className="mt-2 p-2 bg-light" style={{ maxHeight: '300px', overflow: 'auto', fontSize: '0.85em' }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
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
                    <Form.Label>Hours to Look Back</Form.Label>
                    <Form.Select value={hours} onChange={(e) => setHours(parseInt(e.target.value))}>
                        <option value={1}>Last 1 hour</option>
                        <option value={6}>Last 6 hours</option>
                        <option value={12}>Last 12 hours</option>
                        <option value={24}>Last 24 hours</option>
                        <option value={48}>Last 48 hours</option>
                        <option value={168}>Last week</option>
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
                        `Run ${agentName}`
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
