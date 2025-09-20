/**
 * Utility class for time-related operations
 */
class TimeUtils {
    /**
     * Parses a time string (e.g., "15m", "7d") into seconds.
     * @param {string} timeString - The time string to parse.
     * @param {number} defaultValue - The default value to return if parsing fails.
     * @returns {number} - The parsed time in seconds.
     */
    static parseTimeString(timeString, defaultValue) {
        if (!timeString) return defaultValue;
        const match = timeString.match(/^(\d+)([smhd])$/i);
        if (!match) {
            console.error(`Invalid time string format: ${timeString}`);
            return defaultValue;
        }

        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 's': return value; // Seconds
            case 'm': return value * 60; // Minutes
            case 'h': return value * 3600; // Hours
            case 'd': return value * 86400; // Days
            default: return defaultValue;
        }
    }
}

export default TimeUtils;