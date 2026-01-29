const promClient = require('prom-client');

// Activer les métriques par défaut (CPU, RAM, etc.)
promClient.collectDefaultMetrics();

const register = promClient.register;

// Helper to get or create metric
const getOrCreateCounter = (name, help, labelNames) => {
    return register.getSingleMetric(name) || new promClient.Counter({ name, help, labelNames });
};

const getOrCreateHistogram = (name, help, labelNames, buckets) => {
    return register.getSingleMetric(name) || new promClient.Histogram({ name, help, labelNames, buckets });
};

// Compteur des requêtes HTTP (RED : Rate)
const httpRequestsTotal = getOrCreateCounter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'route', 'status']
);

// Histogramme de la durée des requêtes (RED : Duration) - percentiles p50, p95, p99
const httpRequestDurationSeconds = getOrCreateHistogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'route', 'status'],
    [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
);

// Compteur des tentatives de login (métrique business)
const loginAttemptsTotal = getOrCreateCounter(
    'login_attempts_total',
    'Total number of login attempts',
    ['status']
);

// Compteur des créations d'utilisateurs
const userRegistrationsTotal = getOrCreateCounter(
    'user_registrations_total',
    'Total number of user registrations',
    ['status']
);

// Compteur des téléchargements de fichiers
const fileDownloadsTotal = getOrCreateCounter(
    'file_downloads_total',
    'Total number of file downloads',
    ['filename', 'status']
);

module.exports = {
    promClient,
    httpRequestsTotal,
    httpRequestDurationSeconds,
    loginAttemptsTotal,
    userRegistrationsTotal,
    fileDownloadsTotal
};