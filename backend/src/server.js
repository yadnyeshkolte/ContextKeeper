require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/contextkeeper', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Schemas
const DecisionSchema = new mongoose.Schema({
    topic: String,
    decision: String,
    reasoning: String,
    sources: Array,
    participants: Array,
    date: { type: Date, default: Date.now }
});
const Decision = mongoose.model('Decision', DecisionSchema);

// API Routes

// Configuration Endpoint - Returns default repository settings
app.get('/api/config', (req, res) => {
    res.json({
        defaultRepository: process.env.GITHUB_REPO,
        defaultBranch: 'main',
        apiVersion: '1.0.0'
    });
});

// Query Endpoint (RAG)
app.post('/api/query', async (req, res) => {
    const { question, repository, branch } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // Determine repository name and branch
    const repoName = repository || process.env.GITHUB_REPO;
    const branchName = branch || 'main';

    // Call Python RAG script with repository and branch parameters
    const args = [path.join(__dirname, '../scripts/rag_engine.py'), question];
    if (repoName) {
        args.push(repoName);
    }
    if (branchName) {
        args.push(branchName);
    }

    const pythonProcess = spawn('python', args);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Failed to process query' });
        }
        try {
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (e) {
            // Fallback if not JSON or pure text
            res.json({ answer: dataString, sources: [], relatedPeople: [], timeline: [] });
        }
    });
});

// In-memory cache for knowledge graph data
const knowledgeGraphCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Knowledge Graph Endpoint - Now uses real data from knowledge_graph_builder.py with caching
app.get('/api/knowledge-graph', async (req, res) => {
    const { repository, branch, noCache } = req.query;
    const repoName = repository || process.env.GITHUB_REPO;
    const branchName = branch || 'main';
    const cacheKey = `${repoName}:${branchName}`;

    // Check cache first (unless noCache is specified)
    if (noCache !== 'true') {
        const cached = knowledgeGraphCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log(`Knowledge Graph: Serving from cache for ${cacheKey}`);
            return res.json(cached.data);
        }
    }

    console.log(`Knowledge Graph: Building graph for ${cacheKey}`);

    // Call Python knowledge graph builder script
    const args = [path.join(__dirname, '../scripts/knowledge_graph_builder.py')];
    if (repoName) {
        args.push(repoName);
    }
    if (branchName) {
        args.push(branchName);
    }

    const pythonProcess = spawn('python', args);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.log(`Knowledge Graph Builder: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Knowledge graph building failed:', errorString);
            // Return empty graph on error
            return res.json({ nodes: [], links: [], error: errorString });
        }
        try {
            const result = JSON.parse(dataString);

            // Cache the result
            knowledgeGraphCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            res.json(result);
        } catch (e) {
            console.error('Failed to parse knowledge graph output:', e);
            res.json({ nodes: [], links: [], error: 'Failed to parse graph data' });
        }
    });
});

// Context for file Endpoint
app.post('/api/context/file', (req, res) => {
    const { filepath } = req.body;
    // Mock response
    res.json({
        history: [{ date: "2023-10-01", event: "Created file" }],
        decisions: ["Use ES6 modules"],
        experts: ["@mike"]
    });
});

// Sync Repository Endpoint - Syncs all branches from a repository
app.post('/api/sync-repo', async (req, res) => {
    console.log('Triggering repository-wide sync (all branches)...');
    const { repository } = req.body;
    const repoName = repository || process.env.GITHUB_REPO;

    if (!repoName) {
        return res.status(400).json({ error: 'Repository name is required' });
    }

    const args = [path.join(__dirname, '../scripts/github_collector.py'), '--sync-all-branches', repoName];
    const pythonProcess = spawn('python', args);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.log(`Repo Sync: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Repository sync failed:', errorString);
            return res.status(500).json({
                error: 'Failed to sync repository',
                details: errorString
            });
        }
        try {
            const result = JSON.parse(dataString);
            console.log('Repository sync successful:', result);

            // Clear all knowledge graph cache entries for this repository
            let clearedCount = 0;
            for (const key of knowledgeGraphCache.keys()) {
                if (key.startsWith(`${repoName}:`)) {
                    knowledgeGraphCache.delete(key);
                    clearedCount++;
                }
            }
            if (clearedCount > 0) {
                console.log(`Cleared ${clearedCount} knowledge graph cache entries for ${repoName}`);
            }

            res.json({
                success: true,
                ...result
            });
        } catch (e) {
            console.error('Failed to parse repo sync output:', e);
            res.json({
                success: true,
                message: 'Repository synced but response parsing failed',
                raw: dataString
            });
        }
    });
});

// Sync Data Endpoint - Syncs data from a specific branch
app.post('/api/sync-data', async (req, res) => {
    console.log('Triggering branch-specific data sync...');
    const { repository, branch } = req.body;
    const repoName = repository || process.env.GITHUB_REPO;
    const branchName = branch || 'main';

    const args = [path.join(__dirname, '../scripts/github_collector.py')];
    if (repoName) {
        args.push(repoName);
    }
    if (branchName) {
        args.push(branchName);
    }

    const pythonProcess = spawn('python', args);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.log(`Data Sync: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Data sync failed:', errorString);
            return res.status(500).json({
                error: 'Failed to sync data',
                details: errorString
            });
        }
        try {
            const result = JSON.parse(dataString);
            console.log('Data sync successful:', result);

            // Clear knowledge graph cache for this repository/branch
            const cacheKey = `${repoName}:${branchName}`;
            if (knowledgeGraphCache.has(cacheKey)) {
                knowledgeGraphCache.delete(cacheKey);
                console.log(`Cleared knowledge graph cache for ${cacheKey}`);
            }

            res.json({
                success: true,
                ...result
            });
        } catch (e) {
            console.error('Failed to parse data sync output:', e);
            res.json({
                success: true,
                message: 'Data synced but response parsing failed',
                raw: dataString
            });
        }
    });
});

// Slack Collection Endpoint
app.post('/api/collect/slack', async (req, res) => {
    console.log('Triggering Slack data collection...');
    const { repository, branch } = req.body;
    const repoName = repository || process.env.GITHUB_REPO;
    const branchName = branch || 'main';

    const args = [path.join(__dirname, '../scripts/slack_collector.py')];
    if (repoName) {
        args.push(repoName);
    }
    if (branchName) {
        args.push(branchName);
    }

    const pythonProcess = spawn('python', args);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.log(`Slack Collector: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Slack collection failed:', errorString);
            return res.status(500).json({
                error: 'Failed to collect Slack data',
                details: errorString
            });
        }
        try {
            const result = JSON.parse(dataString);
            console.log('Slack collection successful:', result);
            res.json({
                success: true,
                ...result
            });
        } catch (e) {
            console.error('Failed to parse Slack collector output:', e);
            res.json({
                success: true,
                message: 'Slack data collected but response parsing failed',
                raw: dataString
            });
        }
    });
});

// Status Endpoint - Check ChromaDB status for specific repository and branch
app.get('/api/status', async (req, res) => {
    const { repository, branch } = req.query;
    const repoName = repository || process.env.GITHUB_REPO || 'default';
    const branchName = branch || 'main';

    // Use Python script to check ChromaDB status
    const args = [
        path.join(__dirname, '../scripts/github_collector.py'),
        '--check-db',
        repoName
    ];
    if (branchName) {
        args.push(branchName);
    }

    const pythonProcess = spawn('python', args, { cwd: path.join(__dirname, '..') });

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        try {
            const chromaResult = JSON.parse(dataString);
            res.json({
                chromadb: {
                    count: chromaResult.count || 0,
                    status: chromaResult.exists ? 'ok' : 'not_initialized',
                    path: chromaResult.path,
                    repository: repoName,
                    branch: branchName
                },
                mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error('Failed to parse status check:', e, errorString);
            res.json({
                chromadb: { count: 0, status: 'error', repository: repoName, branch: branchName },
                mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Branches Endpoint - Cache-First approach
app.get('/api/branches', async (req, res) => {
    const { repository, noCache } = req.query;
    const repoName = repository || process.env.GITHUB_REPO;
    const repoSafeKey = repoName.replace("/", "_");

    if (!repoName) {
        return res.status(400).json({ error: 'Repository name is required' });
    }

    // 1. Try to get from local cache first (MongoDB/File)
    // We run python script with --local-only
    const args = [path.join(__dirname, '../scripts/github_collector.py'), '--list-branches', repoName, '--local-only'];

    // Asynchronous background check function
    const triggerBackgroundUpdateCheck = () => {
        console.log(`[Background] Checking for updates for ${repoName}...`);
        const updateArgs = [
            path.join(__dirname, '../scripts/github_collector.py'),
            '--check-updates',
            repoName,
            'main' // Default checking main branch for repo updates, or we could iterate all. 
            // Ideally we check the repo connectivity.
        ];
        // We're just firing this off. The result isn't captured here but relying on the client to poll /api/check-updates
        // Actually, to make /api/check-updates fast, we might want to store state.
        // But for now, let's keep it simple: Client calls /api/branches (receive cached), 
        // then Client calls /api/check-updates (which runs the python script).
        // So we don't *need* to trigger it here if the client is responsible for polling.
        // However, the requirement says "trigger a background/parallel process... after local MongoDB data is loaded".
        // The most robust way is:
        // Client: load /api/branches (fast)
        // Client: useEffect -> /api/check-updates (slow, background)
        // Server: /api/check-updates (runs script, returns result)
    };

    const pythonProcess = spawn('python', args);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        // console.log(`Branch Lister: ${data}`); // Optional logging
    });

    pythonProcess.on('close', (code) => {
        // If local fetch fails or empty, we might want to just return empty array and let background sync handle it
        try {
            const result = JSON.parse(dataString);

            // If we have local branches, great.
            // If not, it returns empty list.

            res.json(result);

        } catch (e) {
            console.error('Failed to parse local branches output:', e);
            // Fallback: return empty list
            res.json({ branches: [], from_cache: true, error: "Failed to parse local cache" });
        }
    });
});

// Check Updates Endpoint - Check if there are new commits/branches available
app.get('/api/check-updates', async (req, res) => {
    const { repository, branch } = req.query;
    const repoName = repository || process.env.GITHUB_REPO;
    const branchName = branch || 'main';

    if (!repoName) {
        return res.status(400).json({ error: 'Repository name is required' });
    }

    const args = [
        path.join(__dirname, '../scripts/github_collector.py'),
        '--check-updates',
        repoName,
        branchName
    ];

    const pythonProcess = spawn('python', args);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            // If check fails (e.g. network issue), we assume no updates or let client know
            console.error('Update check failed:', errorString);
            return res.status(200).json({ update_available: false, error: errorString });
        }
        try {
            const result = JSON.parse(dataString);
            // Result structure: { update_available: bool, local_commit: str, remote_commit: str, ... }
            res.json(result);
        } catch (e) {
            console.error('Failed to parse update check output:', e);
            res.json({ update_available: false, error: 'Parse error' });
        }
    });
});

// Accept Update Endpoint - Trigger Sync
app.post('/api/accept-update', (req, res) => {
    const { repository, branch, type } = req.body;
    // type can be 'all' (sync-repo) or 'branch' (sync-data)

    // We just forward to the existing sync endpoints internally or reroute logic
    // But since those endpoints exist, the Frontend can just call them directly.
    // However, for semantic clarity, we can use this endpoint.
    // For now, let's keep it simple: Frontend calls /api/sync-repo or /api/sync-data directly.
    // But if we want a specific "Accept Update" action that might do more cleanup, we can place it here.

    // Let's implement it as a convenient wrapper.
    if (type === 'repo_sync') {
        // We can't easily redirect with a POST body in Express internally without code refactor,
        // so we'll just instruct the client to call the right endpoint, or we invoke the logic.
        // Re-using the logic from /api/sync-repo would be best by refactoring logic into a function.
        // But for minimal disturbance, let's just return success and let the Frontend call the sync endpoints.
        res.json({ action: "call_sync_api", endpoint: "/api/sync-repo" });
    } else {
        res.json({ action: "call_sync_api", endpoint: "/api/sync-data" });
    }
});


app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});
