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

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: false
}).then(() => console.log("Conectado ao MongoDB!"))
  .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

app.use("/api/auth", authRoutes);  // Rota de autenticação
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Documentação Swagger

app.listen(3000, () => console.log("API rodando na porta 3000"));
