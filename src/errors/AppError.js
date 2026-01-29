/**
 * Classe d'erreur de base pour l'application
 * Permet de distinguer les erreurs opérationnelles des bugs
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de validation (400)
 */
class ValidationError extends AppError {
  constructor(message = 'Validation error') {
    super(message, 400, true);
  }
}

/**
 * Erreur d'authentification (401)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, true);
  }
}

/**
 * Erreur d'autorisation (403)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, true);
  }
}

/**
 * Ressource non trouvée (404)
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, true);
  }
}

/**
 * Erreur serveur interne (500)
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, false);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
};
