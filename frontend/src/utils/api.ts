/**
 * API Configuration Utility
 * Provides the correct API base URL based on the environment
 */

/**
 * Get the API base URL
 * In production (Vercel), use relative paths which will route to /api
 * In development, use localhost backend
 */
export function getApiUrl(): string {
    // Check if we're running in production (Vercel)
    if (import.meta.env.PROD) {
        // In production, use relative API paths (Vercel will route /api to serverless functions)
        return '';
    }

    // In development, check for environment variable
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl) {
        return envApiUrl;
    }

    // Default to localhost
    return 'http://localhost:3000';
}

/**
 * Build a full API endpoint URL
 * @param endpoint - The API endpoint path (e.g., '/api/config')
 */
export function buildApiUrl(endpoint: string): string {
    const baseUrl = getApiUrl();

    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // In production, we just use the endpoint (relative path)
    if (import.meta.env.PROD) {
        return normalizedEndpoint;
    }

    // In development, combine base URL with endpoint
    return `${baseUrl}${normalizedEndpoint}`;
}

/**
 * Fetch wrapper with automatic API URL handling
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
    const url = buildApiUrl(endpoint);
    return fetch(url, options);
}
