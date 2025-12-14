import { useState } from 'react';
import { Container, Nav, Tab, Button, Alert } from 'react-bootstrap';
import AgentRunner from './AgentRunner';
import DecisionPanel from './DecisionPanel';

interface AIAgentsProps {
    repository: string;
    branch: string;
}

export default function AIAgents({ repository, branch }: AIAgentsProps) {
    const [summarizerJobId, setSummarizerJobId] = useState<string | null>(null);
    const [decisionJobId, setDecisionJobId] = useState<string | null>(null);
    const [decisionResult, setDecisionResult] = useState<any>(null);
    const [isLoadingDecision, setIsLoadingDecision] = useState(false);
    const [decisionError, setDecisionError] = useState<string | null>(null);

    const runDecisionEngine = async () => {
        if (!summarizerJobId) {
            alert('Please run the AI Summarizer first');
            return;
        }

        try {
            setIsLoadingDecision(true);
            setDecisionError(null);
            setDecisionResult(null);

            const res = await fetch('http://localhost:3000/api/agents/decide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summarizerJobId })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to start decision engine');
            }

            setDecisionJobId(data.jobId);

            // Poll for completion
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`http://localhost:3000/api/agents/status/${data.jobId}`);
                    const statusData = await statusRes.json();

                    if (statusData.status === 'completed') {
                        setDecisionResult(statusData.result);
                        setIsLoadingDecision(false);
                        clearInterval(pollInterval);
                    } else if (statusData.status === 'failed') {
                        setDecisionError(statusData.error || 'Decision engine failed');
                        setIsLoadingDecision(false);
                        clearInterval(pollInterval);
                    }
                } catch (err: any) {
                    console.error('Failed to poll decision engine status:', err);
                }
            }, 2000);
        } catch (err: any) {
            setDecisionError(err.message || 'Failed to run decision engine');
            setIsLoadingDecision(false);
        }
    };

    return (
        <Container>
            <div className="mb-4">
                <h2>🤖 AI Agents Dashboard</h2>
                <p className="text-muted">
                    Run individual agents or the unified AI summarizer to analyze your project data.
                </p>
            </div>

            <Tab.Container defaultActiveKey="github">
                <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                        <Nav.Link eventKey="github">GitHub Agent</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="slack">Slack Agent</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="notion">Notion Agent</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="summarize">🌟 Unified Summarizer</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="decisions">📊 Decision Engine</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>
                    <Tab.Pane eventKey="github">
                        <AgentRunner
                            agentType="github"
                            agentName="GitHub Agent"
                            repository={repository}
                            branch={branch}
                        />
                    </Tab.Pane>

                    <Tab.Pane eventKey="slack">
                        <AgentRunner
                            agentType="slack"
                            agentName="Slack Agent"
                            repository={repository}
                        />
                    </Tab.Pane>

                    <Tab.Pane eventKey="notion">
                        <AgentRunner
                            agentType="notion"
                            agentName="Notion Agent"
                        />
                    </Tab.Pane>

                    <Tab.Pane eventKey="summarize">
                        <Alert variant="info" className="mb-4">
                            <strong>Unified AI Summarizer</strong> runs all three agents (GitHub, Slack, Notion) and generates a comprehensive summary using Hugging Face AI models.
                        </Alert>
                        <AgentRunner
                            agentType="summarize"
                            agentName="AI Summarizer (All Agents)"
                            repository={repository}
                            branch={branch}
                            onJobComplete={(jobId) => setSummarizerJobId(jobId)}
                        />
                        {summarizerJobId && (
                            <Alert variant="success" className="mt-3">
                                ✓ Summarizer completed successfully! Job ID: <code>{summarizerJobId}</code>
                                <br />
                                <Button variant="primary" size="sm" className="mt-2" onClick={runDecisionEngine}>
                                    Run Decision Engine →
                                </Button>
                            </Alert>
                        )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="decisions">
                        <Alert variant="info" className="mb-4">
                            <strong>Decision Engine</strong> analyzes the unified summary and provides intelligent recommendations with confidence scores.
                        </Alert>

                        {!summarizerJobId && (
                            <Alert variant="warning">
                                Please run the <strong>Unified Summarizer</strong> first before using the Decision Engine.
                            </Alert>
                        )}

                        {summarizerJobId && !isLoadingDecision && !decisionResult && (
                            <Button variant="primary" onClick={runDecisionEngine}>
                                Run Decision Engine
                            </Button>
                        )}

                        {isLoadingDecision && (
                            <Alert variant="info">
                                <div className="d-flex align-items-center">
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    Running decision engine analysis... (Job ID: {decisionJobId})
                                </div>
                            </Alert>
                        )}

                        {decisionError && (
                            <Alert variant="danger">
                                <strong>Error:</strong> {decisionError}
                            </Alert>
                        )}

                        {decisionResult && <DecisionPanel decisions={decisionResult} />}
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </Container>
    );
}
