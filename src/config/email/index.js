import nodemailer from 'nodemailer';
import { config } from '../index.js';
import { logger } from '../logger.js';

/**
 * Create a NodeMailer transporter based on environment configuration
 */
const createTransporter = () => {
    // Use environment variables for SMTP configuration
    const { host, port, secure, auth, from } = config.email;

    // If no host is configured, create a test account
    if (!host) {
        logger.warn('No email host configured, using ethereal test account');
        return createTestTransporter();
    }

    // Create real transporter with configured settings
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: auth.user,
            pass: auth.pass,
        },
    });

    return { transporter, defaultFrom: from };
};

/**
 * Create a test transporter for development
 * Uses ethereal.email to create a test account
 */
const createTestTransporter = async () => {
    try {
        // Generate test SMTP service account from ethereal.email
        const testAccount = await nodemailer.createTestAccount();
        logger.info('Created Ethereal test email account', {
            user: testAccount.user
        });

        // Create a reusable transporter using the test account
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        return {
            transporter,
            defaultFrom: testAccount.user,
            isTestAccount: true
        };
    } catch (error) {
        logger.error('Failed to create test email account', { error });
        throw error;
    }
};

// Export a singleton instance of the transporter
let transporterInstance = null;

/**
 * Get the transporter instance, creating it if necessary
 */
export const getTransporter = async () => {
    if (!transporterInstance) {
        transporterInstance = await createTransporter();
    }
    return transporterInstance;
};

/**
 * Send an email
 * @param {Object} options Email options
 * @returns {Promise<Object>} Email send info
 */
export const sendEmail = async (options) => {
    try {
        const { transporter, defaultFrom, isTestAccount } = await getTransporter();

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: options.from || defaultFrom,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });

        logger.info('Email sent successfully', {
            messageId: info.messageId,
            to: options.to,
            subject: options.subject
        });

        // If using a test account, log the preview URL
        if (isTestAccount) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            logger.info(`Email preview URL: ${previewUrl}`);
            return { ...info, previewUrl };
        }

        return info;
    } catch (error) {
        logger.error('Failed to send email', {
            error: error.message,
            to: options.to,
            subject: options.subject
        });
        throw error;
    }
};