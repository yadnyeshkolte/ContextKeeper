interface DecisionPanelProps {
    decisions: any;
}

export default function DecisionPanel({ decisions }: DecisionPanelProps) {
    if (!decisions || !decisions.success) {
        return (
            <div className="alert-warning">
                <span className="text-lg">⚠️</span>
                <div>
                    <strong>Decision Engine Unavailable</strong>
                    <br />
                    Decision engine data not available or failed to execute.
                </div>
            </div>
        );
    }

    const { urgency_analysis, patterns, high_confidence_recommendations } = decisions;

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case 'critical': return 'rose';
            case 'high': return 'amber';
            case 'medium': return 'blue';
            default: return 'gray';
        }
    };

    const getUrgencyBadgeClass = (level: string) => {
        switch (level) {
            case 'critical': return 'bg-rose-500';
            case 'high': return 'bg-amber-500';
            case 'medium': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'critical': return 'badge-danger';
            case 'high': return 'badge-warning';
            case 'medium': return 'badge-info';
            default: return 'badge-secondary';
        }
    };

    const urgencyColor = getUrgencyColor(urgency_analysis.urgency_level);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Urgency Analysis */}
            <div className="glass-card overflow-hidden">
                <div className="bg-gradient-accent text-white p-4 sm:p-6">
                    <h3 className="text-xl font-semibold">⚡ Urgency Analysis</h3>
                </div>
                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Urgency Level */}
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 text-center">
                            <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-3">Urgency Level</h4>
                            <span className={`inline-block px-6 py-3 text-lg font-bold text-white rounded-lg ${getUrgencyBadgeClass(urgency_analysis.urgency_level)}`}>
                                {urgency_analysis.urgency_level.toUpperCase()}
                            </span>
                            <div className="mt-4">
                                <div className="progress-bar h-4">
                                    <div
                                        className={`progress-bar-fill ${getUrgencyBadgeClass(urgency_analysis.urgency_level)}`}
                                        style={{ width: `${urgency_analysis.urgency_score * 100}%` }}
                                    ></div>
                                </div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {(urgency_analysis.urgency_score * 100).toFixed(0)}% Urgency Score
                                </p>
                            </div>
                        </div>

                        {/* Urgent Items Count */}
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-bold text-${urgencyColor}-500`}>
                                {urgency_analysis.urgent_items_count}
                            </span>
                            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">Urgent Items Detected</p>
                        </div>
                    </div>

                    <div className={`alert-${urgencyColor === 'rose' ? 'danger' : urgencyColor === 'amber' ? 'warning' : 'info'}`}>
                        <span className="text-lg">💡</span>
                        <div>
                            <strong>Recommendation:</strong> {urgency_analysis.recommendation}
                        </div>
                    </div>
                </div>
            </div>

            {/* High Confidence Recommendations */}
            {high_confidence_recommendations && high_confidence_recommendations.length > 0 && (
                <div className="glass-card overflow-hidden">
                    <div className="bg-gradient-secondary text-white p-4 sm:p-6 flex justify-between items-center">
                        <h3 className="text-xl font-semibold">🎯 Recommended Actions</h3>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                            {high_confidence_recommendations.length} High Confidence
                        </span>
                    </div>
                    <div className="p-6 space-y-4">
                        {high_confidence_recommendations.map((rec: any, idx: number) => (
                            <div key={idx} className="glass-card-solid p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{rec.title}</h4>
                                    <div className="flex gap-2">
                                        <span className={getPriorityBadgeClass(rec.priority)}>
                                            {rec.priority.toUpperCase()}
                                        </span>
                                        <span className="badge-success">
                                            {(rec.confidence * 100).toFixed(0)}% Confidence
                                        </span>
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                    {rec.description}
                                </p>
                                {rec.action_items && rec.action_items.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                                        <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">✅ Action Items:</h5>
                                        <ul className="space-y-2">
                                            {rec.action_items.map((action: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                    <span className="text-emerald-500 mt-1">•</span>
                                                    <span>{action}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Patterns */}
            {patterns && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Active Contributors */}
                    {patterns.active_contributors && patterns.active_contributors.length > 0 && (
                        <div className="glass-card overflow-hidden">
                            <div className="bg-gradient-cool p-4">
                                <h3 className="text-lg font-semibold text-gray-800">👥 Top Contributors</h3>
                            </div>
                            <div className="p-4 space-y-2">
                                {patterns.active_contributors.map((contrib: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{contrib.name}</span>
                                        <span className="badge-primary">{contrib.commits} commits</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hot Topics */}
                    {patterns.hot_topics && patterns.hot_topics.length > 0 && (
                        <div className="glass-card overflow-hidden">
                            <div className="bg-gradient-warm p-4">
                                <h3 className="text-lg font-semibold text-gray-800">🔥 Hot Topics</h3>
                            </div>
                            <div className="p-4">
                                <div className="flex flex-wrap gap-2">
                                    {patterns.hot_topics.map((topic: any, idx: number) => (
                                        <span key={idx} className="badge-danger px-3 py-1.5 text-sm">
                                            {topic.topic} ({topic.mentions})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
