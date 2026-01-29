const logger = require('../config/logger');
const { AppError } = require('../errors/AppError');

/**
 * Error handler global sécurisé
 * - Différencie les erreurs opérationnelles des bugs
 * - Masque les détails techniques en production
 * - Log les erreurs avec contexte
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Si l'erreur est déjà une AppError, l'utiliser telle quelle
  let error = err;

  // Si ce n'est pas une AppError, la convertir
  if (!(err instanceof AppError)) {
    // Erreur de validation Express (ex: JSON malformé)
    if (err.name === 'ValidationError' || err.name === 'SyntaxError') {
      error = new AppError('Invalid request data', 400, true);
    }
    // Erreur de base de données (ex: contrainte unique)
    else if (err.code === '23505') { // PostgreSQL unique violation
      error = new AppError('Resource already exists', 409, true);
    }
    // Erreur de connexion DB
    else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      error = new AppError('Database connection failed', 503, false);
    }
    // Erreur générique non gérée
    else {
      error = new AppError('Internal server error', 500, false);
    }
  }

  // Déterminer le niveau de log
  const logLevel = error.isOperational ? 'warn' : 'error';

  // Construire le contexte de log
  const logContext = {
    message: error.message,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  };

  // En développement, ajouter plus de détails
  if (process.env.NODE_ENV !== 'production') {
    logContext.originalError = err.message;
    if (err.stack && !error.isOperational) {
      logContext.stack = err.stack;
    }
  }

  // Logger l'erreur
  logger[logLevel]('Request error', logContext);

  // Réponse HTTP
  const response = {
    error: process.env.NODE_ENV === 'production'
      ? (error.isOperational ? error.message : 'Internal server error')
      : error.message,
  };

  // En développement, ajouter plus d'infos
  if (process.env.NODE_ENV !== 'production' && !error.isOperational) {
    response.details = {
      originalError: err.message,
      stack: err.stack,
    };
  }

  res.status(error.statusCode).json(response);
}

module.exports = errorHandler;
