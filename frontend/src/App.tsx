import { useState } from 'react';
import './App.css';
import KnowledgeGraph from './components/KnowledgeGraph';
import SyncStatus from './components/SyncStatus';

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

  const handleQuery = async () => {
    if (!query) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:3000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });
      const data: QueryResult = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Query failed", error);
      setResult({ answer: "Error connecting to backend.", sources: [], relatedPeople: [], timeline: [] });
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🧠 ContextKeeper</h1>
        <p>AI Memory Layer for Development Teams</p>
        <nav>
          <button onClick={() => setActiveTab('query')} className={activeTab === 'query' ? 'active' : ''}>Query</button>
          <button onClick={() => setActiveTab('graph')} className={activeTab === 'graph' ? 'active' : ''}>Knowledge Graph</button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'query' && (
          <>
            <SyncStatus />
            <div className="search-section">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask: 'Why did we use Redis?'"
                className="search-input"
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              />
              <button onClick={handleQuery} disabled={loading} className="search-button">
                {loading ? 'Asking AI...' : 'Ask ContextKeeper'}
              </button>
            </div>

            {result && (
              <div className="result-section">
                <div className="result-card">
                  <h2>Answer</h2>
                  <div className="answer-text">
                    {result.answer.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>

                <div className="meta-grid">
                  <div className="meta-card">
                    <h3>📚 Sources</h3>
                    <ul>
                      {result.sources && result.sources.map((s, i) => (
                        <li key={i}>
                          <a href={s.link} target="_blank" rel="noopener noreferrer">
                            <span className="source-type">[{s.type}]</span> {s.title || 'Source'}
                          </a>
                        </li>
                      ))}
                      {(!result.sources || result.sources.length === 0) && <li>No specific sources found.</li>}
                    </ul>
                  </div>
                  <div className="meta-card">
                    <h3>👥 Experts</h3>
                    <div className="tags">
                      {result.relatedPeople && result.relatedPeople.map(p => <span key={p} className="tag">{p}</span>)}
                      {(!result.relatedPeople || result.relatedPeople.length === 0) && <span>No experts identified</span>}
                    </div>
                  </div>
                  {result.timeline && result.timeline.length > 0 && (
                    <div className="meta-card timeline-card">
                      <h3>📅 Timeline</h3>
                      <div className="timeline">
                        {result.timeline.map((event, i) => (
                          <div key={i} className="timeline-item">
                            <div className="timeline-date">
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="timeline-event">
                              <a href={event.url} target="_blank" rel="noopener noreferrer">
                                {event.event}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'graph' && <KnowledgeGraph />}

      </main>
    </div>
  );
}

export default App;
