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
        defaultRepository: process.env.GITHUB_REPO || 'yadnyeshkolte/ContextKeeper',
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

// Knowledge Graph Endpoint - Now uses real data from knowledge_graph_builder.py
app.get('/api/knowledge-graph', async (req, res) => {
    const { repository, branch } = req.query;
    const repoName = repository || process.env.GITHUB_REPO;
    const branchName = branch || 'main';

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

// GitHub Collection Endpoint
app.post('/api/collect/github', async (req, res) => {
    console.log('Triggering GitHub data collection...');
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
        console.log(`GitHub Collector: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('GitHub collection failed:', errorString);
            return res.status(500).json({
                error: 'Failed to collect GitHub data',
                details: errorString
            });
        }
        try {
            const result = JSON.parse(dataString);
            console.log('GitHub collection successful:', result);
            res.json({
                success: true,
                ...result
            });
        } catch (e) {
            console.error('Failed to parse GitHub collector output:', e);
            res.json({
                success: true,
                message: 'GitHub data collected but response parsing failed',
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
    const repoSafeName = repoName.replace('/', '_');
    const branchSafeName = branchName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const chromaPath = `./chroma_db_${repoSafeName}_${branchSafeName}`;

    // Call Python script to check ChromaDB status
    const pythonProcess = spawn('python', [
        '-c',
        `
import chromadb
import json
import os
try:
    chroma_path = "${chromaPath}"
    if os.path.exists(chroma_path):
        client = chromadb.PersistentClient(path=chroma_path)
        collection = client.get_or_create_collection("context_${repoSafeName}_${branchSafeName}")
        count = collection.count()
        print(json.dumps({"count": count, "status": "ok", "repository": "${repoName}", "branch": "${branchName}", "path": chroma_path}))
    else:
        print(json.dumps({"count": 0, "status": "not_initialized", "repository": "${repoName}", "branch": "${branchName}", "path": chroma_path}))
except Exception as e:
    print(json.dumps({"count": 0, "status": "error", "error": str(e), "repository": "${repoName}", "branch": "${branchName}"}))
`
    ], { cwd: path.join(__dirname, '..') });

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        try {
            const result = JSON.parse(dataString);
            res.json({
                chromadb: result,
                mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            res.json({
                chromadb: { count: 0, status: 'error', repository: repoName },
                mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Branches Endpoint - List available branches for a repository
app.get('/api/branches', async (req, res) => {
    const { repository } = req.query;
    const repoName = repository || process.env.GITHUB_REPO;

    if (!repoName) {
        return res.status(400).json({ error: 'Repository name is required' });
    }

    const args = [path.join(__dirname, '../scripts/github_collector.py'), '--list-branches', repoName];
    const pythonProcess = spawn('python', args);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.log(`Branch Lister: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Failed to list branches:', errorString);
            return res.status(500).json({
                error: 'Failed to list branches',
                details: errorString
            });
        }
        try {
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (e) {
            console.error('Failed to parse branches output:', e);
            res.status(500).json({
                error: 'Failed to parse branches data',
                raw: dataString
            });
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
