# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]


# # Stage 1: Build
# FROM node:18-alpine AS builder

# WORKDIR /app

# # Copier les fichiers de dépendances
# COPY package*.json ./

# # Installer les dépendances
# RUN npm ci --only=production && npm cache clean --force

# # Stage 2: Production
# FROM node:18-alpine

# WORKDIR /app

# # Créer un utilisateur non-root pour la sécurité
# RUN addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001

# # Copier les dépendances depuis le stage builder
# COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# # Copier le code de l'application
# COPY --chown=nodejs:nodejs package*.json ./
# COPY --chown=nodejs:nodejs src ./src
# COPY --chown=nodejs:nodejs scripts ./scripts

# # Créer le dossier uploads avec les bonnes permissions
# RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# # Passer à l'utilisateur non-root
# USER nodejs

# # Exposer le port
# EXPOSE 3000

# # Variables d'environnement par défaut
# ENV NODE_ENV=production
# ENV PORT=3000

# # Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# # Commande de démarrage
# CMD ["npm", "start"]
