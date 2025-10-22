FROM node:18-alpine

WORKDIR /app

# Copiar package.json primeiro para cache das dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY . .

# Criar pasta uploads
RUN mkdir -p uploads

# Expor porta
EXPOSE 3000

# Comando para rodar
CMD ["node", "server.js"]