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
        const { repository, branch } = req.query;
        const repoName = repository || process.env.GITHUB_REPO;
        const branchName = branch || 'main';

        if (!repoName) {
            return res.status(400).json({ error: 'Repository name is required' });
        }

        const result = await executePythonScript(
            'backend/scripts/github_collector.py',
            ['--check-updates', repoName, branchName],
            { timeout: 15000 }
        );

        if (!result.success) {
            console.error('Update check failed:', result.error);
            return res.status(200).json({
                update_available: false,
                error: result.error
            });
        }

        res.status(200).json(result.data);
    } catch (error) {
        console.error('Check updates error:', error);
        res.status(200).json({
            update_available: false,
            error: error.message
        });
    }
};
