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
        const { repository } = req.body;
        const repoName = repository || process.env.GITHUB_REPO;

        if (!repoName) {
            return res.status(400).json({ error: 'Repository name is required' });
        }

        console.log('Triggering repository-wide sync (all branches)...');

        const result = await executePythonScript(
            'backend/scripts/github_collector.py',
            ['--sync-all-branches', repoName],
            { timeout: 55000 }
        );

        if (!result.success) {
            console.error('Repository sync failed:', result.error);
            return res.status(500).json({
                error: 'Failed to sync repository',
                details: result.error
            });
        }

        console.log('Repository sync successful:', result.data);
        res.status(200).json({
            success: true,
            ...result.data
        });
    } catch (error) {
        console.error('Sync repo error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};
