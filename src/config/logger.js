const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Niveau de log selon l'environnement
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Format JSON avec Trace ID (pour corrélation avec les traces)
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format((info) => {
    // Récupérer le Trace ID du span actif (si OpenTelemetry est actif)
    try {
      const { trace } = require('@opentelemetry/api');
      const span = trace.getActiveSpan();
      if (span) {
        const spanContext = span.spanContext();
        info.traceId = spanContext.traceId;
        info.spanId = spanContext.spanId;
      }
      // eslint-disable-next-line
    } catch (e) {
      // OpenTelemetry non disponible, ignorer
    }
    return info;
  })(),
  winston.format.json()
);

// Format lisible pour la console en dev
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const logger = winston.createLogger({
  level,
  format: jsonFormat,
  defaultMeta: { service: 'devsecops-api' },
  transports: [
    new DailyRotateFile({ // Fichier pour tous les logs
      filename: path.join('logs', 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({ // Fichier séparé pour les erreurs
      level: 'error',
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}


module.exports = logger;