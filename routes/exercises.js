const express = require("express");
const router = express.Router();
const exerciseController = require("../controllers/exerciseController");
const { authenticate } = require("../middleware/authMiddleware");

// Todas as rotas protegidas por autenticação
router.use(authenticate);

// Criar novo exercício
router.post("/instructor/:instructorId", exerciseController.createExercise);

// Listar exercícios de um instrutor
router.get("/instructor/:instructorId", exerciseController.getExercisesByInstructor);

// Estatísticas dos exercícios
router.get("/instructor/:instructorId/stats", exerciseController.getExerciseStats);

// Buscar exercício por ID
router.get("/:exerciseId", exerciseController.getExerciseById);

// Atualizar exercício
router.put("/:exerciseId", exerciseController.updateExercise);

// Deletar exercício
router.delete("/:exerciseId", exerciseController.deleteExercise);

module.exports = router;
