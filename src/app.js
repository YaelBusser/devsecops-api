require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const logger = require('./config/logger');
const { promClient, httpRequestsTotal, httpRequestDurationSeconds } = require('./config/prometheus-config');

const app = express();
const PORT = process.env.PORT || 3000;

const requestLogger = require('./middlewares/requestLogger');



app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  }
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
// Middleware métriques : Rate + Duration (RED)
app.use((req, res, next) => {
  const start = Date.now();
  const route = String(req.route?.path || req.path || 'unknown');
  res.on('finish', () => {
    const durationSeconds = (Date.now() - start) / 1000;
    const method = String(req.method);
    const status = String(res.statusCode);
    httpRequestsTotal.inc({ method, route, status });
    httpRequestDurationSeconds.observe({ method, route, status }, durationSeconds);
  });
  next();
});
// Endpoint /metrics pour Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  // Créer quelques fichiers de test
  fs.writeFileSync(path.join(uploadsDir, 'photo.jpg'), 'fake image content');
  fs.writeFileSync(path.join(uploadsDir, 'document.pdf'), 'fake pdf content');
}

// Routes
const pool = require('./config/database');
const loginRouter = require('./auth/login')(pool);
const filesRouter = require('./api/files');
const usersRouter = require('./api/users');

// Page d'accueil
app.get('/', (req, res) => {
  res.json({
    message: 'API DevSecOps - Exercice Jour 1',
    warning: '🚨 Cette API contient des vulnérabilités à des fins pédagogiques',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authentification',
        example: {
          username: 'admin',
          password: 'password123' // generic-secret-disable-line
        }
      },
      {
        method: 'GET',
        path: '/api/files?name=photo.jpg',
        description: 'Téléchargement de fichiers',
        example: '/api/files?name=photo.jpg'
      },
      {
        method: 'POST',
        path: '/api/users',
        description: 'Création d\'utilisateur (CHALLENGE)',
        example: {
          email: 'user@example.com',
          password: 'mypassword', // generic-secret-disable-line
          role: 'user'
        }
      },
      {
        method: 'GET',
        path: '/api/health',
        description: 'Health check',
        example: '/api/health'
      }
    ],
    exercises: [
      '1. Analyser le code de /api/auth/login et trouver les vulnérabilités',
      '2. Analyser le code de /api/files et trouver les vulnérabilités',
      '3. Analyser le code de /api/users et trouver TOUTES les vulnérabilités (CHALLENGE)',
      '4. Configurer git-secrets pour bloquer les commits de secrets'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Monter les routes
// Monter les routes
const authenticateToken = require('./middlewares/auth');

app.use('/api/auth', loginRouter);
app.use('/api', usersRouter); // Public (Registration)
app.use('/api', authenticateToken, filesRouter); // Protected

app.use('/', require('./openapi/openapi'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler global sécurisé
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// Démarrage du serveur déplacé vers server.js pour testabilité
// app.listen(...)

module.exports = app;
