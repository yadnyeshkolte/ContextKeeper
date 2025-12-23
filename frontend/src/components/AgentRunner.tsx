import { useState, useEffect } from 'react';

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

    useEffect(() => {
        if (!jobId) return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/agents/status/${jobId}`);
                const data = await res.json();
                setJobStatus(data);

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(pollInterval);
                    if (data.status === 'completed' && onJobComplete) {
                        onJobComplete(jobId);
                    }
                }
            } catch (err) {
                console.error('Failed to poll job status:', err);
            }
        }, 2000);

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

    const getStatusColor = () => {
        if (!jobStatus) return 'bg-gray-200 dark:bg-slate-600';
        switch (jobStatus.status) {
            case 'completed': return 'bg-emerald-500';
            case 'failed': return 'bg-rose-500';
            case 'running': return 'bg-primary-500';
            default: return 'bg-gray-400';
        }
    };

    const getStatusBadgeClass = () => {
        if (!jobStatus) return 'badge-secondary';
        switch (jobStatus.status) {
            case 'completed': return 'badge-success';
            case 'failed': return 'badge-danger';
            case 'running': return 'badge-primary';
            default: return 'badge-secondary';
        }
    };

    const renderResult = () => {
        if (!jobStatus?.result) return null;
        const result = jobStatus.result;

        return (
            <div className="glass-card overflow-hidden mt-4 animate-fade-in-up">
                <div className="card-header-gradient">
                    <h4 className="font-semibold">✨ Analysis Results</h4>
                </div>
                <div className="p-6 space-y-4">
                    {/* AI Summary */}
                    {result.ai_summary && (
                        <div className="glass-card-solid overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-600">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🤖</span>
                                    <h5 className="font-semibold text-gray-800 dark:text-gray-100">AI-Generated Summary</h5>
                                </div>
                            </div>
                            <div className="p-4">
                                {result.ai_summary.success ? (
                                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 p-4 rounded-lg whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {result.ai_summary.summary}
                                    </div>
                                ) : (
                                    <div className="alert-warning">
                                        <strong>⚠️ Summary Generation Failed:</strong> {result.ai_summary.error}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Urgent Items (GitHub) */}
                    {result.urgent_items && result.urgent_items.length > 0 && (
                        <div className="glass-card-solid overflow-hidden">
                            <div className="px-4 py-3 bg-rose-500 text-white flex justify-between items-center">
                                <h5 className="font-semibold">⚠️ Urgent Items</h5>
                                <span className="badge bg-white/20 text-white">{result.urgent_items.length} items</span>
                            </div>
                            <div className="p-4 space-y-3">
                                {result.urgent_items.slice(0, 10).map((item: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-lg border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-900/20">
                                        <div className="flex flex-wrap gap-2 items-center mb-1">
                                            <span className="badge-danger text-xs uppercase">{item.type}</span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">#{item.number}: {item.title}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <strong>Reason:</strong> {item.reason}
                                        </p>
                                    </div>
                                ))}
                                {result.urgent_items.length > 10 && (
                                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                                        ... and {result.urgent_items.length - 10} more urgent items
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Items (Slack) */}
                    {result.action_items && result.action_items.length > 0 && (
                        <div className="glass-card-solid overflow-hidden">
                            <div className="px-4 py-3 bg-primary-500 text-white flex justify-between items-center">
                                <h5 className="font-semibold">📋 Action Items</h5>
                                <span className="badge bg-white/20 text-white">{result.action_items.length} items</span>
                            </div>
                            <div className="p-4 space-y-2">
                                {result.action_items.slice(0, 10).map((item: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-lg border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20">
                                        <div className="flex items-start gap-2">
                                            <span className="badge-primary text-xs mt-1">{item.channel}</span>
                                            <div>
                                                <strong className="text-gray-800 dark:text-gray-200">{item.author}:</strong>{' '}
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {item.text.substring(0, 200)}{item.text.length > 200 ? '...' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {result.action_items.length > 10 && (
                                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                                        ... and {result.action_items.length - 10} more action items
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Key Discussions (Slack) */}
                    {result.key_discussions && result.key_discussions.length > 0 && (
                        <div className="glass-card-solid overflow-hidden">
                            <div className="px-4 py-3 bg-cyan-500 text-white flex justify-between items-center">
                                <h5 className="font-semibold">💬 Key Discussions</h5>
                                <span className="badge bg-white/20 text-white">{result.key_discussions.length} discussions</span>
                            </div>
                            <div className="p-4 space-y-3">
                                {result.key_discussions.slice(0, 5).map((disc: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-lg border-l-4 border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20">
                                        <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                            <span className="badge-info text-xs mr-2">#{disc.channel}</span>
                                            {disc.topic.substring(0, 150)}{disc.topic.length > 150 ? '...' : ''}
                                        </h6>
                                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <span>💬 <strong>{disc.reply_count}</strong> replies</span>
                                            <span>👥 <strong>{disc.participants.length}</strong> participants</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Priority Changes (Notion) */}
                    {result.priority_changes && result.priority_changes.length > 0 && (
                        <div className="glass-card-solid overflow-hidden">
                            <div className="px-4 py-3 bg-amber-400 text-gray-900 flex justify-between items-center">
                                <h5 className="font-semibold">🎯 Priority Changes</h5>
                                <span className="badge bg-gray-900/20 text-gray-900">{result.priority_changes.length} changes</span>
                            </div>
                            <div className="p-4 space-y-2">
                                {result.priority_changes.map((change: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20">
                                        <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{change.title}</h6>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{change.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Raw JSON Toggle */}
                    <details className="glass-card-solid">
                        <summary className="px-4 py-3 cursor-pointer font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 select-none">
                            🔍 View Raw JSON Data
                        </summary>
                        <pre className="p-4 bg-gray-50 dark:bg-slate-800 text-sm overflow-auto max-h-96 font-mono">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        );
    };

    return (
        <div className="glass-card overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{agentName}</h4>
            </div>
            <div className="p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📅 Time Range
                    </label>
                    <select
                        value={hours}
                        onChange={(e) => setHours(parseInt(e.target.value))}
                        className="select-field"
                    >
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
                    </select>
                </div>

                <button
                    onClick={runAgent}
                    disabled={!!jobId && jobStatus?.status === 'running'}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                    {jobId && jobStatus?.status === 'running' ? (
                        <>
                            <span className="spinner"></span>
                            Running Agent...
                        </>
                    ) : (
                        `Run ${agentName}`
                    )}
                </button>

                {error && (
                    <div className="alert-danger mt-4">
                        {error}
                    </div>
                )}

                {jobStatus && (
                    <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                            <span className={getStatusBadgeClass()}>
                                {jobStatus.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="progress-bar">
                            <div
                                className={`progress-bar-fill ${getStatusColor()}`}
                                style={{ width: `${jobStatus.progress}%` }}
                            ></div>
                        </div>
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            {jobStatus.progress}%
                        </p>

                        {jobStatus.status === 'failed' && jobStatus.error && (
                            <div className="alert-danger">
                                <strong>Error:</strong> {jobStatus.error}
                            </div>
                        )}

                        {jobStatus.status === 'completed' && renderResult()}
                    </div>
                )}
            </div>
        </div>
    );
}
