const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const swaggerDocs = require("./docs/swagger");
const studentsRoutes = require("./routes/students")
const authRoutes = require("./routes/auth");
const instructorRoutes = require("./routes/instructors");
const workoutRoutes = require("./routes/workoutPlans");
const workoutSessionRoutes = require("./routes/workoutSessions");
const progressRoutes = require("./routes/progress");
const gymRoutes = require("./routes/gyms");
const equipmentRoutes = require("./routes/equipments");
const exerciseRoutes = require("./routes/exercises");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const app = express();

// Middleware - Aumentar limite para suportar imagens base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
  cors({
    origin: ['http://localhost:8080', 'http://localhost:8081'],
    credentials: true
  })
);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/workout-sessions", workoutSessionRoutes);
app.use("/api/student", progressRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/exercises", exerciseRoutes);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('💥 Erro não capturado:', error);
  console.error('📍 Stack trace:', error.stack);
  console.error('📋 Request URL:', req.url);
  console.error('📋 Request Method:', req.method);
  console.error('📋 Request Body:', req.body);
  res.status(500).json({ 
    message: 'Erro interno do servidor', 
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});