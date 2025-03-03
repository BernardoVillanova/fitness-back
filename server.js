const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const swaggerDocs = require("./docs/swagger");
const authRoutes = require("./routes/auth");
const instructorRoutes = require("./routes/instructors");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/instructors", instructorRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});