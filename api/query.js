const { executePythonScript } = require('./_lib/pythonRunner');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question, repository, branch } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const repoName = repository || process.env.GITHUB_REPO;
        const branchName = branch || 'main';

        const args = [question];
        if (repoName) args.push(repoName);
        if (branchName) args.push(branchName);

        // Execute RAG engine
        const result = await executePythonScript(
            'backend/scripts/rag_engine.py',
            args,
            { timeout: 55000 }
        );

        if (!result.success) {
            return res.status(500).json({
                error: 'Failed to process query',
                details: result.error
            });
        }

        res.status(200).json(result.data);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};
