const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./docs/swagger");

const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

const conectarDB = async () => {
  try {
    console.log("Conectando ao MongoDB Atlas...", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Tempo máximo para tentar conectar
      tls: true, // Força a conexão segura
      retryWrites: true,
      w: "majority"
    });

    console.log("✅ Conectado ao MongoDB Atlas!");
  } catch (err) {
    console.error("❌ Erro ao conectar ao MongoDB:", err);
    process.exit(1);
  }
};

conectarDB();

app.use("/api/auth", authRoutes);  // Rota de autenticação
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Documentação Swagger

app.listen(3000, () => console.log("API rodando na porta 3000"));
