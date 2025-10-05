const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const workoutSessionController = require('../controllers/workoutSessionController');

// Endpoint de teste SEM autenticação para debug
router.get('/debug/instructor/:instructorId/sessions', async (req, res) => {
  try {
    const { instructorId } = req.params;
    console.log('🧪 [DEBUG] Endpoint chamado para instrutor:', instructorId);
    
    const Student = require('../models/student');
    const WorkoutSession = require('../models/workoutSession');
    
    // Buscar todos os alunos do instrutor
    const students = await Student.find({ instructorId });
    console.log('🧪 [DEBUG] Alunos encontrados:', students.length);
    
    if (!students.length) {
      return res.json({ 
        success: false,
        message: 'Nenhum aluno encontrado para este instrutor',
        instructorId,
        students: [],
        sessions: []
      });
    }
    
    const studentIds = students.map(student => student._id);
    
    // Buscar todas as sessões dos alunos do instrutor
    const sessions = await WorkoutSession.find({
      studentId: { $in: studentIds }
    })
    .sort({ startTime: -1 })
    .populate('workoutPlanId')
    .populate('studentId', 'name email personalInfo');
    
    console.log('🧪 [DEBUG] Sessões encontradas:', sessions.length);
    
    res.json({
      success: true,
      total: sessions.length,
      sessions: sessions,
      students: students,
      instructorId,
      debug: {
        studentsFound: students.length,
        sessionsFound: sessions.length,
        studentIds: studentIds
      }
    });
  } catch (error) {
    console.error('🧪 [DEBUG] Erro:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

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

// Buscar todas as sessões para dashboard
router.get('/sessions/all', workoutSessionController.getAllStudentSessions);

// Buscar sessões de todos os alunos de um instrutor (para dashboard do instrutor)
router.get('/sessions/instructor/:instructorId?', workoutSessionController.getInstructorStudentSessions);

// Endpoint de teste sem autenticação para debug
router.get('/test/instructor/:instructorId/sessions', async (req, res) => {
  try {
    const { instructorId } = req.params;
    console.log('🧪 [TEST] Buscando sessões para instrutor:', instructorId);
    
    const Student = require('../models/student');
    const WorkoutSession = require('../models/workoutSession');
    
    // Buscar todos os alunos do instrutor
    const students = await Student.find({ instructorId });
    console.log('🧪 [TEST] Alunos encontrados:', students.length);
    
    if (!students.length) {
      return res.json({ 
        success: false,
        message: 'Nenhum aluno encontrado para este instrutor',
        instructorId,
        students: [],
        sessions: []
      });
    }
    
    const studentIds = students.map(student => student._id);
    
    // Buscar todas as sessões dos alunos do instrutor
    const sessions = await WorkoutSession.find({
      studentId: { $in: studentIds }
    })
    .sort({ startTime: -1 })
    .populate('workoutPlanId')
    .populate('studentId', 'name email personalInfo');
    
    console.log('🧪 [TEST] Sessões encontradas:', sessions.length);
    
    res.json({
      success: true,
      total: sessions.length,
      sessions: sessions,
      students: students,
      instructorId,
      debug: {
        studentsFound: students.length,
        sessionsFound: sessions.length,
        studentIds: studentIds
      }
    });
  } catch (error) {
    console.error('🧪 [TEST] Erro:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
