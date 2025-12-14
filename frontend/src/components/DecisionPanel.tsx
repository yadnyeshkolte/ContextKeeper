import { Card, Alert, Badge, ProgressBar, Row, Col } from 'react-bootstrap';

interface DecisionPanelProps {
    decisions: any;
}

export default function DecisionPanel({ decisions }: DecisionPanelProps) {
    if (!decisions || !decisions.success) {
        return (
            <Alert variant="warning" className="shadow-sm">
                <strong>⚠️ Decision Engine Unavailable</strong>
                <br />
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
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    padding: '1.5rem'
                }}>
                    <h4 className="mb-0">⚡ Urgency Analysis</h4>
                </Card.Header>
                <Card.Body className="p-4">
                    <Row className="mb-4">
                        <Col md={6}>
                            <Card className="border-0 bg-light h-100">
                                <Card.Body>
                                    <div className="text-center mb-3">
                                        <h6 className="text-muted mb-3">Urgency Level</h6>
                                        <Badge
                                            bg={getUrgencyColor(urgency_analysis.urgency_level)}
                                            className="px-4 py-3 fs-5">
                                            {urgency_analysis.urgency_level.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <ProgressBar
                                        now={urgency_analysis.urgency_score * 100}
                                        label={`${(urgency_analysis.urgency_score * 100).toFixed(0)}%`}
                                        variant={getUrgencyColor(urgency_analysis.urgency_level)}
                                        style={{ height: '30px', fontSize: '1rem' }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="border-0 bg-light h-100">
                                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                                    <h1 className="display-3 mb-2 fw-bold text-{getUrgencyColor(urgency_analysis.urgency_level)}">
                                        {urgency_analysis.urgent_items_count}
                                    </h1>
                                    <p className="text-muted mb-0 fs-5">Urgent Items Detected</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Alert
                        variant={getUrgencyColor(urgency_analysis.urgency_level)}
                        className="mb-0 border-0 shadow-sm"
                        style={{ fontSize: '1.05rem', lineHeight: '1.7' }}
                    >
                        <strong>💡 Recommendation:</strong> {urgency_analysis.recommendation}
                    </Alert>
                </Card.Body>
            </Card>

            {/* High Confidence Recommendations */}
            {high_confidence_recommendations && high_confidence_recommendations.length > 0 && (
                <Card className="mb-4 shadow-sm border-0">
                    <Card.Header style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        padding: '1.5rem'
                    }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">🎯 Recommended Actions</h4>
                            <Badge bg="light" text="dark" className="px-3 py-2 fs-6">
                                {high_confidence_recommendations.length} High Confidence
                            </Badge>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {high_confidence_recommendations.map((rec: any, idx: number) => (
                            <Card key={idx} className="mb-3 border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="mb-0">{rec.title}</h5>
                                        <div className="d-flex gap-2">
                                            <Badge bg={getPriorityVariant(rec.priority)} className="px-3 py-2">
                                                {rec.priority.toUpperCase()}
                                            </Badge>
                                            <Badge bg="success" className="px-3 py-2">
                                                {(rec.confidence * 100).toFixed(0)}% Confidence
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-muted mb-3" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                                        {rec.description}
                                    </p>
                                    {rec.action_items && rec.action_items.length > 0 && (
                                        <Card className="bg-light border-0">
                                            <Card.Body>
                                                <h6 className="mb-3">✅ Action Items:</h6>
                                                <ul className="mb-0" style={{ fontSize: '0.95rem' }}>
                                                    {rec.action_items.map((action: string, i: number) => (
                                                        <li key={i} className="mb-2">{action}</li>
                                                    ))}
                                                </ul>
                                            </Card.Body>
                                        </Card>
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
                            <Card className="mb-4 shadow-sm border-0">
                                <Card.Header style={{
                                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                                    padding: '1rem'
                                }}>
                                    <h5 className="mb-0">👥 Top Contributors</h5>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    {patterns.active_contributors.map((contrib: any, idx: number) => (
                                        <Card key={idx} className="mb-2 border-0 bg-light">
                                            <Card.Body className="py-2 px-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="fw-bold">{contrib.name}</span>
                                                    <Badge bg="primary" className="px-3 py-2">
                                                        {contrib.commits} commits
                                                    </Badge>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    )}

                    {/* Hot Topics */}
                    {patterns.hot_topics && patterns.hot_topics.length > 0 && (
                        <Col md={6}>
                            <Card className="mb-4 shadow-sm border-0">
                                <Card.Header style={{
                                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                                    padding: '1rem'
                                }}>
                                    <h5 className="mb-0">🔥 Hot Topics</h5>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <div className="d-flex flex-wrap gap-2">
                                        {patterns.hot_topics.map((topic: any, idx: number) => (
                                            <Badge
                                                key={idx}
                                                bg="danger"
                                                className="px-3 py-2"
                                                style={{ fontSize: '0.9rem' }}
                                            >
                                                {topic.topic} ({topic.mentions})
                                            </Badge>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    )}
                </Row>
            )}
        </div>
    );
}
