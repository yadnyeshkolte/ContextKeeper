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
        const { repository, branch } = req.body;
        const repoName = repository || process.env.GITHUB_REPO;
        const branchName = branch || 'main';

        console.log('Triggering branch-specific data sync...');

        const args = [];
        if (repoName) args.push(repoName);
        if (branchName) args.push(branchName);

        const result = await executePythonScript(
            'backend/scripts/github_collector.py',
            args,
            { timeout: 55000 }
        );

        if (!result.success) {
            console.error('Data sync failed:', result.error);
            return res.status(500).json({
                error: 'Failed to sync data',
                details: result.error
            });
        }

        console.log('Data sync successful:', result.data);
        res.status(200).json({
            success: true,
            ...result.data
        });
    } catch (error) {
        console.error('Sync data error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};
