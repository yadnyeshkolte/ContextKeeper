import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './index.css';
import KnowledgeGraph from './components/KnowledgeGraph';
import SyncStatus from './components/SyncStatus';
import RepositorySelector from './components/RepositorySelector';
import NotificationOverlay from './components/NotificationOverlay';
import AIAgents from './components/AIAgents';

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
  const [activeTab, setActiveTab] = useState<'query' | 'graph' | 'agents'>('query');
  const [repository, setRepository] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [hasUpdates, setHasUpdates] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

    checkForUpdates();
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

  const tabs = [
    { id: 'query' as const, label: '🔍 Query', icon: '🔍' },
    { id: 'graph' as const, label: '🕸️ Knowledge Graph', icon: '🕸️' },
    { id: 'agents' as const, label: '🤖 AI Agents', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {hasUpdates && (
        <NotificationOverlay
          message={updateMessage}
          onFetch={handleFetchUpdates}
          onDismiss={handleDismissNotification}
        />
      )}

      {/* Header */}
      <header className="bg-gradient-primary text-white py-8 mb-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-shadow-lg animate-fade-in">
                🧠 ContextKeeper
              </h1>
              <p className="text-lg text-white/90 animate-fade-in-up">
                AI Memory Layer for Development Teams
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {/* Tab Navigation */}
        <nav className="mb-6 animate-fade-in">
          <div className="flex gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-gradient-primary text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Query Tab */}
        <div className={`${activeTab === 'query' ? 'block animate-fade-in' : 'hidden'}`}>
          <RepositorySelector repository={repository} onRepositoryChange={setRepository} />
          <SyncStatus repository={repository} branch={branch} onBranchChange={setBranch} />

          {/* Search Card */}
          <div className="glass-card p-6 mb-6 animate-fade-in-up">
            <div className="space-y-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask: 'Why did we use Redis?'"
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                className="input-field text-lg"
              />
              <button
                onClick={handleQuery}
                disabled={loading}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Asking AI...
                  </>
                ) : (
                  '🚀 Ask ContextKeeper'
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Answer Card */}
              <div className="glass-card overflow-hidden">
                <div className="card-header-gradient">
                  <h3 className="text-xl font-semibold">💡 Answer</h3>
                </div>
                <div className="p-6 prose prose-indigo dark:prose-invert max-w-none">
                  <ReactMarkdown>{result.answer}</ReactMarkdown>
                </div>
              </div>

              {/* Sources and Experts Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sources */}
                <div className="glass-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">📚 Sources</h3>
                  </div>
                  <div className="p-6">
                    {result.sources && result.sources.length > 0 ? (
                      <ul className="space-y-3">
                        {result.sources.map((s, i) => (
                          <li key={i}>
                            <a
                              href={s.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              <span className="badge-secondary text-xs uppercase">{s.type}</span>
                              <span className="hover:underline">{s.title || 'Source'}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No specific sources found.</p>
                    )}
                  </div>
                </div>

                {/* Experts */}
                <div className="glass-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">👥 Experts</h3>
                  </div>
                  <div className="p-6">
                    {result.relatedPeople && result.relatedPeople.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.relatedPeople.map(p => (
                          <span key={p} className="badge-info">{p}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No experts identified</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {result.timeline && result.timeline.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">📅 Timeline</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {result.timeline.map((event, i) => (
                        <div key={i} className="timeline-item">
                          <div className="text-sm font-medium text-primary-600 dark:text-primary-400 min-w-[100px]">
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            {event.event}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Knowledge Graph Tab */}
        <div className={`${activeTab === 'graph' ? 'block animate-fade-in' : 'hidden'}`}>
          <KnowledgeGraph repository={repository} branch={branch} />
        </div>

        {/* AI Agents Tab */}
        <div className={`${activeTab === 'agents' ? 'block animate-fade-in' : 'hidden'}`}>
          <AIAgents repository={repository} branch={branch} />
        </div>
      </main>
    </div>
  );
}

export default App;
