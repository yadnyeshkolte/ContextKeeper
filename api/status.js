const { connectToDatabase, mongoose } = require('./_lib/db');
const { executePythonScript } = require('./_lib/pythonRunner');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

        const { repository, branch } = req.query;
        const repoName = repository || process.env.GITHUB_REPO || 'default';
        const branchName = branch || 'main';

        // Execute Python script to check ChromaDB status
        const result = await executePythonScript(
            'backend/scripts/github_collector.py',
            ['--check-db', repoName, branchName],
            { timeout: 10000 }
        );

        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        if (!result.success) {
            return res.status(200).json({
                chromadb: {
                    count: 0,
                    status: 'error',
                    error: result.error,
                    repository: repoName,
                    branch: branchName
                },
                mongodb: mongoStatus,
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            chromadb: {
                count: result.data.count || 0,
                status: result.data.exists ? 'ok' : 'not_initialized',
                path: result.data.path,
                repository: repoName,
                branch: branchName
            },
            mongodb: mongoStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            chromadb: { count: 0, status: 'error', error: error.message },
            mongodb: 'error',
            timestamp: new Date().toISOString()
        });
    }
};
