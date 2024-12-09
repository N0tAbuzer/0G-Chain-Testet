import winston from "winston";
const { combine, timestamp, colorize, printf, errors } = winston.format;

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
    },
    colors: {
        error: 'bold red',
        warn: 'bold yellow',
        info: 'bold cyan',
    }
};

winston.addColors(customLevels.colors);

const logger = winston.createLogger({
    levels: customLevels.levels,
    format: combine(
        colorize(),
        errors({ stack: true }),
        timestamp({ format: 'HH:mm:ss DD-MM-YYYY' }),
        printf(({ timestamp, level, message, stack }) => `[${timestamp}] ${level}: ${message}${stack ? `\nStack trace: ${stack}` : ''}`)
    ),
    transports: [
        new winston.transports.Console()
    ]
});

export { logger };
