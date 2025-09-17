/**
 * Unified API response helper
 * @param {Object} options
 * @param {boolean} options.status - Success or failure
 * @param {string} options.message - Message string
 * @param {any} options.data - Response data
 */
export function apiResponse({ status, message, data }) {
    return {
        status,
        message,
        data,
    };
}
