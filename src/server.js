require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});
