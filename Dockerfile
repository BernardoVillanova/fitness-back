FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads/avatars uploads/equipments uploads/exercises uploads/gyms && \
    chmod -R 755 uploads

ENV PORT=3000 \
    NODE_ENV=production \
    API_BASE_URL=http://localhost:3000 \
    CORS_ORIGIN=http://localhost:8080,http://localhost:8081,http://localhost

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/api/docs', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]