const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const workoutSessionController = require('../controllers/workoutSessionController');

// Todas as rotas requerem autenticação
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

// Buscar todas as sessões para dashboard
router.get('/sessions/all', workoutSessionController.getAllStudentSessions);

// Buscar sessões de um aluno específico pelo studentId
router.get('/sessions/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const WorkoutSession = require('../models/workoutSession');
    
    // Buscar todas as sessões do aluno
    const sessions = await WorkoutSession.find({ studentId })
      .sort({ startTime: -1 })
      .populate('workoutPlanId')
      .populate('studentId', 'name email personalInfo');
    
    res.json({
      success: true,
      total: sessions.length,
      sessions: sessions
    });
  } catch (error) {
    console.error('Erro ao buscar sessões do aluno:', error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

// Buscar sessões de todos os alunos de um instrutor (para dashboard do instrutor)
router.get('/sessions/instructor/:instructorId?', workoutSessionController.getInstructorStudentSessions);

module.exports = router;