import { sendEmail } from '../../config/email/index.js';
import { welcomeTemplate, passwordResetTemplate, notificationTemplate } from '../../config/email/templates.js';
import { logger } from '../../config/logger.js';
import { config } from '../../config/index.js';

/**
 * Email Service for application emails
 */
export class EmailService {
    /**
     * Send welcome email with verification link
     * @param {Object} user User object
     * @param {string} token Verification token
     * @returns {Promise<Object>} Email send info
     */
    static async sendWelcomeEmail(user, token) {
        try {
            const { email, firstName, lastName } = user;
            const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || email.split('@')[0];

            // Create verification URL
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

            // Generate email content from template
            const template = welcomeTemplate({
                name,
                verificationUrl,
            });

            // Send email
            return await sendEmail({
                to: email,
                subject: template.subject,
                text: template.text,
                html: template.html,
            });
        } catch (error) {
            logger.error('Failed to send welcome email', {
                userId: user.id,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Send password reset email
     * @param {Object} user User object
     * @param {string} token Password reset token
     * @returns {Promise<Object>} Email send info
     */
    static async sendPasswordResetEmail(user, token) {
        try {
            const { email, firstName, lastName } = user;
            const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || email.split('@')[0];

            // Create reset URL
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetUrl = `${baseUrl}/reset-password?token=${token}`;

            // Generate email content from template
            const template = passwordResetTemplate({
                name,
                resetUrl,
            });

            // Send email
            return await sendEmail({
                to: email,
                subject: template.subject,
                text: template.text,
                html: template.html,
            });
        } catch (error) {
            logger.error('Failed to send password reset email', {
                userId: user.id,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Send notification email
     * @param {Object} options Notification options
     * @returns {Promise<Object>} Email send info
     */
    static async sendNotification(options) {
        try {
            const { user, subject, message, actionUrl, actionText } = options;

            const name = user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || user.email.split('@')[0];

            // Generate email content from template
            const template = notificationTemplate({
                name,
                subject,
                message,
                actionUrl,
                actionText,
            });

            // Send email
            return await sendEmail({
                to: user.email,
                subject: template.subject,
                text: template.text,
                html: template.html,
            });
        } catch (error) {
            logger.error('Failed to send notification email', {
                userId: options.user.id,
                error: error.message,
            });
            throw error;
        }
    }
}