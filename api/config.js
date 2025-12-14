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

    res.status(200).json({
        defaultRepository: process.env.GITHUB_REPO || 'yadnyeshkolte/ContextKeeper',
        defaultBranch: 'main',
        apiVersion: '1.0.0',
        environment: 'production'
    });
};
