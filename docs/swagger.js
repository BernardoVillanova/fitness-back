const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestão de Treinos",
      version: "1.0.0",
      description: "Documentação da API para gestão de treinos e usuários.",
    },
    servers: [
      { url: "http://localhost:3000/" },
    ],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsDoc(options);
