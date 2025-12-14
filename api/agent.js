const { executePythonScript } = require('./_lib/pythonRunner');

// Shared job storage across all agent types
const agentJobs = new Map();

// Helper to create job
function createJob(type, params) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
        jobId,
        type,
        params,
        status: 'queued',
        progress: 0,
        startedAt: new Date().toISOString(),
        completedAt: null,
        result: null,
        error: null
    };
    agentJobs.set(jobId, job);
    return jobId;
}

// Helper to update job
function updateJob(jobId, updates) {
    const job = agentJobs.get(jobId);
    if (job) {
        Object.assign(job, updates);
        agentJobs.set(jobId, job);
    }
}

// Agent configuration mapping
const AGENT_CONFIG = {
    github: {
        script: 'backend/agents/github_agent.py',
        buildArgs: (params) => [
            '--repo', params.repository,
            '--branch', params.branch,
            '--hours', params.hours.toString()
        ]
    },
    slack: {
        script: 'backend/agents/slack_agent.py',
        buildArgs: (params) => [
            '--repo', params.repository,
            '--hours', params.hours.toString()
        ]
    },
    notion: {
        script: 'backend/agents/notion_agent.py',
        buildArgs: (params) => [
            '--hours', params.hours.toString()
        ]
    },
    summarize: {
        script: 'backend/scripts/unified_summarizer.py',
        buildArgs: (params) => [
            '--repo', params.repository,
            '--branch', params.branch,
            '--hours', params.hours.toString()
        ]
    },
    decide: {
        script: 'backend/scripts/decision_engine.py',
        buildArgs: (params) => [
            '--repo', params.repository,
            '--branch', params.branch,
            '--hours', params.hours.toString()
        ]
    }
};

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
        // Get agent type from query parameter
        const { type } = req.query;

        if (!type) {
            return res.status(400).json({
                error: 'Missing agent type',
                details: 'Please specify ?type=github|slack|notion|summarize|decide'
            });
        }

        const agentConfig = AGENT_CONFIG[type];
        if (!agentConfig) {
            return res.status(400).json({
                error: 'Invalid agent type',
                details: `Valid types are: ${Object.keys(AGENT_CONFIG).join(', ')}`
            });
        }

        // Parse request body and set defaults
        const { repository, branch, hours } = req.body;
        const params = {
            repository: repository || process.env.GITHUB_REPO,
            branch: branch || 'main',
            hours: hours || 24
        };

        // Create job
        const jobId = createJob(type, params);

        // Return job ID immediately
        res.status(200).json({ jobId, status: 'queued' });

        // Run agent asynchronously (non-blocking)
        setImmediate(async () => {
            updateJob(jobId, { status: 'running', progress: 10 });

            const result = await executePythonScript(
                agentConfig.script,
                agentConfig.buildArgs(params),
                { timeout: 55000 }
            );

            if (!result.success) {
                updateJob(jobId, {
                    status: 'failed',
                    error: result.error || `${type} agent execution failed`,
                    completedAt: new Date().toISOString(),
                    progress: 100
                });
            } else {
                updateJob(jobId, {
                    status: 'completed',
                    result: result.data,
                    completedAt: new Date().toISOString(),
                    progress: 100
                });
            }
        });
    } catch (error) {
        console.error('Agent router error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};

// Export job tracking for status endpoint
module.exports.agentJobs = agentJobs;
