const winstonConfig = require('winston-daily-rotate-file');
const winston = require('winston');
const logDir = '/var/log/cloud_manage_logs';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => {
            return `${info.timestamp} ${info.level} [${info.filename}]: ${info.message}`;
        }),
        winston.format.colorize()
    ),
    transports: [
        new winstonConfig({
            level: 'info',
            dirname: logDir,
            filename: 'cloud-managing-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: false,
            maxSize: '50m',
            maxFiles: '5'
        })   
    ]
});

function logMessage(level, message, filename) {
    logger.log({ level, message, filename });
}

module.exports = logMessage;