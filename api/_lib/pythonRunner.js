const { spawn } = require('child_process');
const path = require('path');

/**
 * Execute a Python script with arguments
 * @param {string} scriptPath - Relative path to Python script from project root
 * @param {array} args - Arguments to pass to the script
 * @param {object} options - Additional options
 * @returns {Promise} - Resolves with { success, data, error }
 */
function executePythonScript(scriptPath, args = [], options = {}) {
    return new Promise((resolve) => {
        const pythonCmd = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');
        const fullPath = path.join(process.cwd(), scriptPath);

        const pythonProcess = spawn(pythonCmd, [fullPath, ...args], {
            cwd: options.cwd || process.cwd(),
            env: { ...process.env, ...options.env }
        });

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
            if (options.logStderr !== false) {
                console.log(`Python: ${data}`);
            }
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return resolve({
                    success: false,
                    error: errorString || `Process exited with code ${code}`,
                    data: null
                });
            }

            try {
                const result = JSON.parse(dataString);
                resolve({
                    success: true,
                    data: result,
                    error: null
                });
            } catch (e) {
                // If not JSON, return raw string
                resolve({
                    success: true,
                    data: dataString || { message: 'Completed successfully' },
                    error: null
                });
            }
        });

        // Handle timeout
        const timeout = options.timeout || 55000; // 55 seconds default (Vercel has 60s limit)
        setTimeout(() => {
            pythonProcess.kill();
            resolve({
                success: false,
                error: 'Script execution timeout',
                data: null
            });
        }, timeout);
    });
}

module.exports = {
    executePythonScript
};
