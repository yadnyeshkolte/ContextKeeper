const { executePythonScript } = require('./_lib/pythonRunner');

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
        const { repository, branch, noCache } = req.query;
        const repoName = repository || process.env.GITHUB_REPO;
        const branchName = branch || 'main';
        const cacheKey = `${repoName}:${branchName}`;

        // Check cache first
        if (noCache !== 'true') {
            const cached = cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                console.log(`Knowledge Graph: Serving from cache for ${cacheKey}`);
                return res.status(200).json(cached.data);
            }
        }

        console.log(`Knowledge Graph: Building graph for ${cacheKey}`);

        const args = [];
        if (repoName) args.push(repoName);
        if (branchName) args.push(branchName);

        // Execute knowledge graph builder
        const result = await executePythonScript(
            'backend/scripts/knowledge_graph_builder.py',
            args,
            { timeout: 55000 }
        );

        if (!result.success) {
            console.error('Knowledge graph building failed:', result.error);
            return res.status(200).json({
                nodes: [],
                links: [],
                error: result.error
            });
        }

        // Cache the result
        cache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now()
        });

        res.status(200).json(result.data);
    } catch (error) {
        console.error('Knowledge graph error:', error);
        res.status(200).json({
            nodes: [],
            links: [],
            error: error.message
        });
    }
};
