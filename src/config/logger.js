import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Define log directory
const logDir = path.join(process.cwd(), 'logs');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Tell winston that we want to link the colors
winston.addColors(colors);

// Custom format for logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define which transports the logger must use
const transports = [
    // Console transport
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize({ all: true }),
            format,
        ),
    }),

    // File transport for all logs
    new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || '7d',
        format,
    }),

    // File transport for error logs
    new winston.transports.DailyRotateFile({
        level: 'error',
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || '7d',
        format,
    }),
];

// Create the logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
    exceptionHandlers: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
            maxFiles: process.env.LOG_MAX_FILES || '7d',
            format,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
            maxFiles: process.env.LOG_MAX_FILES || '7d',
            format,
        }),
    ],
    exitOnError: false,
});

// Create a stream object with a 'write' function that will be used by morgan
const stream = {
    write: (message) => logger.http(message.trim()),
};

export { logger, stream };