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

// Query Endpoint (RAG)
app.post('/api/query', async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // Call Python RAG script
    const pythonProcess = spawn('python', [
        path.join(__dirname, '../scripts/rag_engine.py'),
        question
    ]);

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

// Knowledge Graph Endpoint
app.get('/api/knowledge-graph', async (req, res) => {
    // Mock data based on user example, in real app this would query Neo4j or complex Mongo aggregation
    const graphData = {
        nodes: [
            { id: "person-mike", group: 1, label: "@mike" },
            { id: "person-sarah", group: 1, label: "@sarah" },
            { id: "module-redis", group: 2, label: "Redis Module" },
            { id: "decision-auth", group: 3, label: "Auth Decision" }
        ],
        links: [
            { source: "person-mike", target: "module-redis", value: 1 },
            { source: "person-sarah", target: "decision-auth", value: 1 }
        ]
    };
    res.json(graphData);
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

    const pythonProcess = spawn('python', [
        path.join(__dirname, '../scripts/github_collector.py')
    ]);

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

// Status Endpoint - Check ChromaDB status
app.get('/api/status', async (req, res) => {
    // Call Python script to check ChromaDB status
    const pythonProcess = spawn('python', [
        '-c',
        `
import chromadb
import json
try:
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection("context")
    count = collection.count()
    print(json.dumps({"count": count, "status": "ok"}))
except Exception as e:
    print(json.dumps({"count": 0, "status": "error", "error": str(e)}))
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
                chromadb: { count: 0, status: 'error' },
                mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            });
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
