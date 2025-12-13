import { useState } from 'react';
import { Container, Nav, Tab, Row, Col, Button, Alert } from 'react-bootstrap';
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

    const runDecisionEngine = async () => {
        if (!summarizerJobId) {
            alert('Please run the AI Summarizer first');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/agents/decide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summarizerJobId })
            });

            const data = await res.json();
            setDecisionJobId(data.jobId);

            // Poll for completion
            const pollInterval = setInterval(async () => {
                const statusRes = await fetch(`http://localhost:3000/api/agents/status/${data.jobId}`);
                const statusData = await statusRes.json();

                if (statusData.status === 'completed') {
                    setDecisionResult(statusData.result);
                    clearInterval(pollInterval);
                } else if (statusData.status === 'failed') {
                    alert('Decision engine failed: ' + statusData.error);
                    clearInterval(pollInterval);
                }
            }, 2000);
        } catch (err: any) {
            alert('Failed to run decision engine: ' + err.message);
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
                        />
                        {summarizerJobId && (
                            <Alert variant="success" className="mt-3">
                                Summarizer job ID: <code>{summarizerJobId}</code>
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

                        {summarizerJobId && !decisionResult && (
                            <Button variant="primary" onClick={runDecisionEngine}>
                                Run Decision Engine
                            </Button>
                        )}

                        {decisionResult && <DecisionPanel decisions={decisionResult} />}
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </Container>
    );
}
