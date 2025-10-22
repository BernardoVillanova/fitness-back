const swaggerJsDoc = require("swagger-jsdoc");

// Construir URL base do servidor a partir de variáveis de ambiente
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestão de Treinos",
      version: "1.0.0",
      description: "Documentação da API para gestão de treinos e usuários.",
    },
    servers: [
      { url: `${API_BASE_URL}/` },
    ],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsDoc(options);
