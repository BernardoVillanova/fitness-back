const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestão de Treinos",
      version: "1.0.0",
      description: "API para autenticação e gerenciamento de treinos."
    }
  },
  apis: ["./routes/*.js"]
};

module.exports = swaggerJsDoc(options);
