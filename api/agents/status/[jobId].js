// Shared job storage across all agent endpoints
// Note: In production, use Redis or a database for persistence
const globalJobs = new Map();

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
        const { jobId } = req.query;

        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        // Try to find job in global storage
        const job = globalJobs.get(jobId);

        if (!job) {
            // Try importing from agent modules (workaround for serverless limitation)
            try {
                const github = require('./github');
                const slack = require('./slack');
                const notion = require('./notion');
                const summarize = require('./summarize');
                const decide = require('./decide');

                const foundJob =
                    github.agentJobs?.get(jobId) ||
                    slack.agentJobs?.get(jobId) ||
                    notion.agentJobs?.get(jobId) ||
                    summarize.agentJobs?.get(jobId) ||
                    decide.agentJobs?.get(jobId);

                if (foundJob) {
                    return res.status(200).json(foundJob);
                }
            } catch (e) {
                // Ignore import errors
            }

            return res.status(404).json({
                error: 'Job not found',
                jobId
            });
        }

        res.status(200).json(job);
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};

module.exports.globalJobs = globalJobs;
