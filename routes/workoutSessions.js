const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const workoutSessionController = require('../controllers/workoutSessionController');

// Rotas protegidas - requerem autenticação
router.use(authenticate);

// Buscar treinos do aluno
router.get('/workouts', workoutSessionController.getStudentWorkouts);

// Verificar sessão ativa
router.get('/sessions/active', workoutSessionController.getActiveSession);

// Iniciar nova sessão
router.post('/sessions/start', workoutSessionController.startSession);

// Atualizar progresso da sessão
router.put('/sessions/:sessionId', workoutSessionController.updateSession);

// Pular exercício
router.post('/sessions/:sessionId/skip-exercise', workoutSessionController.skipExercise);

// Finalizar sessão
router.post('/sessions/:sessionId/complete', workoutSessionController.completeSession);

// Cancelar sessão
router.post('/sessions/:sessionId/cancel', workoutSessionController.cancelSession);

// Histórico de treinos
router.get('/sessions/history', workoutSessionController.getSessionHistory);

module.exports = router;
