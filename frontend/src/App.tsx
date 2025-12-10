import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Nav, Badge } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import KnowledgeGraph from './components/KnowledgeGraph';
import SyncStatus from './components/SyncStatus';
import RepositorySelector from './components/RepositorySelector';
import NotificationOverlay from './components/NotificationOverlay';

interface Source {
  type: string;
  link: string;
  title?: string;
}

interface TimelineEvent {
  date: string;
  event: string;
  url: string;
}

interface QueryResult {
  answer: string;
  sources: Source[];
  relatedPeople: string[];
  timeline: TimelineEvent[];
  context_count?: number;
  results_found?: number;
}

function App() {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'query' | 'graph'>('query');
  const [repository, setRepository] = useState<string>('yadnyeshkolte/ContextKeeper');
  const [branch, setBranch] = useState<string>('main');
  const [hasUpdates, setHasUpdates] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');

  // Fetch default repository from backend config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/config');
        const data = await res.json();
        if (data.defaultRepository) {
          setRepository(data.defaultRepository);
        }
        if (data.defaultBranch) {
          setBranch(data.defaultBranch);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
        // Keep default values on error
      }
    };
    fetchConfig();
  }, []);

  // Check for updates periodically (every 5 minutes)
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/check-updates?repository=${repository}&branch=${branch}`);
        const data = await res.json();

        if (data.has_updates) {
          setHasUpdates(true);
          const message = data.reason ||
            `New commits available. Latest: ${data.remote_commit?.substring(0, 7)}`;
          setUpdateMessage(message);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check immediately on mount
    checkForUpdates();

    // Then check every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [repository, branch]);

  const handleQuery = async () => {
    if (!query) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:3000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, repository, branch })
      });
      const data: QueryResult = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Query failed", error);
      setResult({ answer: "Error connecting to backend.", sources: [], relatedPeople: [], timeline: [] });
    }
    setLoading(false);
  };

  const handleFetchUpdates = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/sync-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository, branch })
      });
      const data = await res.json();
      if (data.success) {
        setHasUpdates(false);
        alert('Data synced successfully!');
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
      alert('Failed to sync data. Please try again.');
    }
  };

  const handleDismissNotification = () => {
    setHasUpdates(false);
  };

  return (
    <div className="min-vh-100 bg-light">
      {hasUpdates && (
        <NotificationOverlay
          message={updateMessage}
          onFetch={handleFetchUpdates}
          onDismiss={handleDismissNotification}
        />
      )}
      <header className="bg-primary text-white py-4 mb-4">
        <Container>
          <h1 className="display-4 mb-2">🧠 ContextKeeper</h1>
          <p className="lead mb-0">AI Memory Layer for Development Teams</p>
        </Container>
      </header>

      <Container>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link active={activeTab === 'query'} onClick={() => setActiveTab('query')}>
              Query
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'graph'} onClick={() => setActiveTab('graph')}>
              Knowledge Graph
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {activeTab === 'query' && (
          <>
            <RepositorySelector repository={repository} onRepositoryChange={setRepository} />
            <SyncStatus repository={repository} branch={branch} onBranchChange={setBranch} />

            <Card className="mb-4">
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    size="lg"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask: 'Why did we use Redis?'"
                    onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleQuery}
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? 'Asking AI...' : 'Ask ContextKeeper'}
                </Button>
              </Card.Body>
            </Card>

            {result && (
              <>
                <Card className="mb-4">
                  <Card.Header as="h5">Answer</Card.Header>
                  <Card.Body>
                    <ReactMarkdown>{result.answer}</ReactMarkdown>
                  </Card.Body>
                </Card>

                <Row className="g-3">
                  <Col md={6}>
                    <Card>
                      <Card.Header>📚 Sources</Card.Header>
                      <Card.Body>
                        {result.sources && result.sources.length > 0 ? (
                          <ul className="list-unstyled">
                            {result.sources.map((s, i) => (
                              <li key={i} className="mb-2">
                                <a href={s.link} target="_blank" rel="noopener noreferrer">
                                  <Badge bg="secondary" className="me-2">{s.type}</Badge>
                                  {s.title || 'Source'}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted">No specific sources found.</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card>
                      <Card.Header>👥 Experts</Card.Header>
                      <Card.Body>
                        {result.relatedPeople && result.relatedPeople.length > 0 ? (
                          <div>
                            {result.relatedPeople.map(p => (
                              <Badge key={p} bg="info" className="me-2 mb-2">{p}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted">No experts identified</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  {result.timeline && result.timeline.length > 0 && (
                    <Col md={12}>
                      <Card>
                        <Card.Header>📅 Timeline</Card.Header>
                        <Card.Body>
                          <div className="timeline">
                            {result.timeline.map((event, i) => (
                              <div key={i} className="d-flex mb-3">
                                <div className="me-3 text-muted" style={{ minWidth: '120px' }}>
                                  {new Date(event.date).toLocaleDateString()}
                                </div>
                                <div>
                                  <a href={event.url} target="_blank" rel="noopener noreferrer">
                                    {event.event}
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                </Row>
              </>
            )}
          </>
        )}

        {activeTab === 'graph' && (
          <KnowledgeGraph repository={repository} branch={branch} />
        )}
      </Container>
    </div>
  );
}

export default App;
