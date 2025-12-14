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
        const { repository } = req.query;
        const repoName = repository || process.env.GITHUB_REPO;

        if (!repoName) {
            return res.status(400).json({ error: 'Repository name is required' });
        }

        // Get branches from local cache
        const result = await executePythonScript(
            'backend/scripts/github_collector.py',
            ['--list-branches', repoName, '--local-only'],
            { timeout: 15000 }
        );

        if (!result.success) {
            return res.status(200).json({
                branches: [],
                from_cache: true,
                error: result.error
            });
        }

        res.status(200).json(result.data);
    } catch (error) {
        console.error('Branch listing error:', error);
        res.status(200).json({
            branches: [],
            from_cache: true,
            error: error.message
        });
    }
};
