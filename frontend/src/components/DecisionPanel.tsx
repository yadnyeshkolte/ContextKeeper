import { Card, Alert, Badge, ProgressBar, Row, Col } from 'react-bootstrap';

interface DecisionPanelProps {
    decisions: any;
}

export default function DecisionPanel({ decisions }: DecisionPanelProps) {
    if (!decisions || !decisions.success) {
        return (
            <Alert variant="warning">
                Decision engine data not available or failed to execute.
            </Alert>
        );
    }

    const { urgency_analysis, patterns, high_confidence_recommendations } = decisions;

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'info';
            default: return 'secondary';
        }
    };

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'info';
            default: return 'secondary';
        }
    };

    return (
        <div>
            {/* Urgency Analysis */}
            <Card className="mb-4">
                <Card.Header className="bg-light">
                    <h5 className="mb-0">⚡ Urgency Analysis</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Urgency Level:</span>
                                    <Badge bg={getUrgencyColor(urgency_analysis.urgency_level)} className="px-3 py-2">
                                        {urgency_analysis.urgency_level.toUpperCase()}
                                    </Badge>
                                </div>
                                <ProgressBar
                                    now={urgency_analysis.urgency_score * 100}
                                    label={`${(urgency_analysis.urgency_score * 100).toFixed(0)}%`}
                                    variant={getUrgencyColor(urgency_analysis.urgency_level)}
                                />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="text-center">
                                <h2 className="mb-0">{urgency_analysis.urgent_items_count}</h2>
                                <small className="text-muted">Urgent Items</small>
                            </div>
                        </Col>
                    </Row>

                    <Alert variant={getUrgencyColor(urgency_analysis.urgency_level)} className="mt-3 mb-0">
                        {urgency_analysis.recommendation}
                    </Alert>
                </Card.Body>
            </Card>

            {/* High Confidence Recommendations */}
            {high_confidence_recommendations && high_confidence_recommendations.length > 0 && (
                <Card className="mb-4">
                    <Card.Header className="bg-light">
                        <h5 className="mb-0">🎯 Recommended Actions (High Confidence)</h5>
                    </Card.Header>
                    <Card.Body>
                        {high_confidence_recommendations.map((rec: any, idx: number) => (
                            <Card key={idx} className="mb-3">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0">{rec.title}</h6>
                                        <div>
                                            <Badge bg={getPriorityVariant(rec.priority)} className="me-2">
                                                {rec.priority.toUpperCase()}
                                            </Badge>
                                            <Badge bg="success">
                                                {(rec.confidence * 100).toFixed(0)}% Confidence
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-muted mb-2">{rec.description}</p>
                                    {rec.action_items && rec.action_items.length > 0 && (
                                        <div>
                                            <strong className="d-block mb-2">Action Items:</strong>
                                            <ul className="mb-0">
                                                {rec.action_items.map((action: string, i: number) => (
                                                    <li key={i}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        ))}
                    </Card.Body>
                </Card>
            )}

            {/* Patterns */}
            {patterns && (
                <Row>
                    {/* Active Contributors */}
                    {patterns.active_contributors && patterns.active_contributors.length > 0 && (
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Header className="bg-light">
                                    <h6 className="mb-0">👥 Top Contributors</h6>
                                </Card.Header>
                                <Card.Body>
                                    {patterns.active_contributors.map((contrib: any, idx: number) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                                            <span>{contrib.name}</span>
                                            <Badge bg="primary">{contrib.commits} commits</Badge>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    )}

                    {/* Hot Topics */}
                    {patterns.hot_topics && patterns.hot_topics.length > 0 && (
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Header className="bg-light">
                                    <h6 className="mb-0">🔥 Hot Topics</h6>
                                </Card.Header>
                                <Card.Body>
                                    {patterns.hot_topics.map((topic: any, idx: number) => (
                                        <Badge key={idx} bg="info" className="me-2 mb-2">
                                            {topic.topic} ({topic.mentions})
                                        </Badge>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    )}
                </Row>
            )}
        </div>
    );
}
