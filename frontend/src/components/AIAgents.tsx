import { useState } from 'react';
import AgentRunner from './AgentRunner';
import DecisionPanel from './DecisionPanel';

interface AIAgentsProps {
    repository: string;
    branch: string;
}

export default function AIAgents({ repository, branch }: AIAgentsProps) {
    const [activeTab, setActiveTab] = useState('github');
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

    const tabs = [
        { id: 'github', label: 'GitHub Agent', icon: '🐙' },
        { id: 'slack', label: 'Slack Agent', icon: '💬' },
        { id: 'notion', label: 'Notion Agent', icon: '📝' },
        { id: 'summarize', label: '🌟 Unified Summarizer', icon: '🌟' },
        { id: 'decisions', label: '📊 Decision Engine', icon: '📊' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    🤖 AI Agents Dashboard
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Run individual agents or the unified AI summarizer to analyze your project data.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="glass-card p-2 mb-6">
                <div className="flex flex-wrap gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-gradient-primary text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in-up">
                {activeTab === 'github' && (
                    <AgentRunner
                        agentType="github"
                        agentName="GitHub Agent"
                        repository={repository}
                        branch={branch}
                    />
                )}

                {activeTab === 'slack' && (
                    <AgentRunner
                        agentType="slack"
                        agentName="Slack Agent"
                        repository={repository}
                    />
                )}

                {activeTab === 'notion' && (
                    <AgentRunner
                        agentType="notion"
                        agentName="Notion Agent"
                    />
                )}

                {activeTab === 'summarize' && (
                    <>
                        <div className="alert-info mb-4">
                            <span className="text-lg">ℹ️</span>
                            <div>
                                <strong>Unified AI Summarizer</strong> runs all three agents (GitHub, Slack, Notion) and generates a comprehensive summary using Hugging Face AI models.
                            </div>
                        </div>
                        <AgentRunner
                            agentType="summarize"
                            agentName="AI Summarizer (All Agents)"
                            repository={repository}
                            branch={branch}
                            onJobComplete={(jobId) => setSummarizerJobId(jobId)}
                        />
                        {summarizerJobId && (
                            <div className="alert-success mt-4">
                                <span className="text-lg">✓</span>
                                <div className="flex-1">
                                    <span>Summarizer completed successfully! Job ID: </span>
                                    <code className="bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded">{summarizerJobId}</code>
                                </div>
                                <button onClick={runDecisionEngine} className="btn-primary text-sm">
                                    Run Decision Engine →
                                </button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'decisions' && (
                    <>
                        <div className="alert-info mb-4">
                            <span className="text-lg">ℹ️</span>
                            <div>
                                <strong>Decision Engine</strong> analyzes the unified summary and provides intelligent recommendations with confidence scores.
                            </div>
                        </div>

                        {!summarizerJobId && (
                            <div className="alert-warning mb-4">
                                <span className="text-lg">⚠️</span>
                                <span>Please run the <strong>Unified Summarizer</strong> first before using the Decision Engine.</span>
                            </div>
                        )}

                        {summarizerJobId && !isLoadingDecision && !decisionResult && (
                            <button onClick={runDecisionEngine} className="btn-primary">
                                Run Decision Engine
                            </button>
                        )}

                        {isLoadingDecision && (
                            <div className="alert-info flex items-center gap-3">
                                <span className="spinner"></span>
                                <span>Running decision engine analysis... (Job ID: {decisionJobId})</span>
                            </div>
                        )}

                        {decisionError && (
                            <div className="alert-danger">
                                <strong>Error:</strong> {decisionError}
                            </div>
                        )}

                        {decisionResult && <DecisionPanel decisions={decisionResult} />}
                    </>
                )}
            </div>
        </div>
    );
}
