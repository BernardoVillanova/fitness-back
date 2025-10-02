const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const swaggerDocs = require("./docs/swagger");
const studentsRoutes = require("./routes/students")
const authRoutes = require("./routes/auth");
const instructorRoutes = require("./routes/instructors");
const workoutRoutes = require("./routes/workoutPlans");
const workoutSessionRoutes = require("./routes/workoutSessions");
const progressRoutes = require("./routes/progress");
const gymRoutes = require("./routes/gyms");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors()
);

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/student", workoutSessionRoutes);
app.use("/api/student", progressRoutes);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});