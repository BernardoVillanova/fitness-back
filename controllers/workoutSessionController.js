const WorkoutSession = require('../models/workoutSession');
const WorkoutPlan = require('../models/workoutPlan');
const Student = require('../models/student');

// Buscar treinos do aluno
exports.getStudentWorkouts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar aluno pelo userId com planos de treino
    const student = await Student.findOne({ userId }).populate('workoutPlans');
    
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    
    // Buscar estatísticas de cada plano
    const workoutsWithStats = await Promise.all(
      student.workoutPlans.map(async (plan) => {
        const completedSessions = await WorkoutSession.countDocuments({
          studentId,
          workoutPlanId: plan._id,
          status: 'completed'
        });
        
        const lastSession = await WorkoutSession.findOne({
          studentId,
          workoutPlanId: plan._id,
          status: 'completed'
        }).sort({ createdAt: -1 });
        
        return {
          ...plan.toObject(),
          completedSessions,
          totalSessions: 12, // pode ser configurável
          lastCompleted: lastSession?.createdAt,
          estimatedTime: 45, // pode calcular baseado no número de exercícios
          estimatedCalories: 280,
          difficulty: 'Intermediário'
        };
      })
    );
    
    res.json(workoutsWithStats);
  } catch (error) {
    console.error('Erro ao buscar treinos:', error);
    res.status(500).json({ message: 'Erro ao buscar treinos do aluno' });
  }
};

// Verificar se há treino em andamento
exports.getActiveSession = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    
    const activeSession = await WorkoutSession.findOne({
      studentId,
      status: 'in-progress'
    }).populate('workoutPlanId');
    
    if (!activeSession) {
      return res.json({ hasActive: false, session: null });
    }
    
    res.json({ 
      hasActive: true, 
      session: activeSession 
    });
  } catch (error) {
    console.error('Erro ao verificar sessão ativa:', error);
    res.status(500).json({ message: 'Erro ao verificar sessão ativa' });
  }
};

// Iniciar nova sessão de treino
exports.startSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workoutPlanId, divisionIndex } = req.body;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    
    // Verificar se já existe sessão ativa
    const existingSession = await WorkoutSession.findOne({
      studentId,
      status: 'in-progress'
    });
    
    if (existingSession) {
      return res.status(400).json({ 
        message: 'Já existe um treino em andamento',
        sessionId: existingSession._id
      });
    }
    
    // Buscar plano de treino
    const workoutPlan = await WorkoutPlan.findById(workoutPlanId);
    if (!workoutPlan) {
      return res.status(404).json({ message: 'Plano de treino não encontrado' });
    }
    
    console.log('WorkoutPlan encontrado:', {
      id: workoutPlan._id,
      name: workoutPlan.name,
      divisions: workoutPlan.divisions?.length || 0
    });
    
    const division = workoutPlan.divisions[divisionIndex];
    if (!division) {
      return res.status(404).json({ message: 'Divisão não encontrada' });
    }
    
    console.log('Division selecionada:', {
      index: divisionIndex,
      name: division.name,
      exercises: division.exercises?.length || 0
    });
    
    // Criar exercícios para a sessão
    const exercises = division.exercises.map((exercise, index) => {
      console.log(`Processando exercício ${index + 1}:`, {
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps
      });
      
      const isBodyWeight = exercise.idealWeight === 0 || !exercise.idealWeight;
      
      return {
        exerciseId: exercise._id?.toString() || `exercise_${index}`,
        exerciseName: exercise.name,
        idealWeight: exercise.idealWeight || 0,
        restTime: exercise.restTime || 60,
        toFailure: exercise.toFailure || false,
        muscleGroups: division.muscleGroups || [],
        sets: Array.from({ length: exercise.sets || 3 }, (_, i) => ({
          setNumber: i + 1,
          reps: exercise.reps || 10,
          weight: exercise.idealWeight || 0,
          isBodyWeight: isBodyWeight,
          actualReps: null,
          completed: false,
          completedAt: null,
          restTimeTaken: null,
          difficulty: null,
          notes: ''
        })),
        notes: exercise.notes || '',
        completed: false,
        completedAt: null,
        skipped: false,
        skipReason: ''
      };
    });
    
    // Calcular total de sets
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    
    // Criar nova sessão
    const newSession = new WorkoutSession({
      studentId,
      workoutPlanId,
      workoutName: workoutPlan.name,
      divisionName: division.name,
      divisionIndex,
      exercises,
      totalExercises: exercises.length,
      completedExercises: 0,
      skippedExercises: 0,
      totalSets,
      completedSets: 0,
      totalVolume: 0,
      studentWeight: student.weight || null,
      startTime: new Date()
    });
    
    console.log('Tentando salvar sessão:', {
      studentId,
      workoutPlanId,
      exercisesCount: exercises.length
    });
    
    await newSession.save();
    
    console.log('Sessão criada com sucesso:', newSession._id);
    
    res.status(201).json({
      message: 'Sessão de treino iniciada',
      session: newSession
    });
  } catch (error) {
    console.error('Erro ao iniciar sessão:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    res.status(500).json({ 
      message: 'Erro ao iniciar sessão de treino',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Atualizar progresso da sessão
exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { exercises, notes, currentExerciseIndex } = req.body;
    const userId = req.user.id;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    
    const session = await WorkoutSession.findOne({
      _id: sessionId,
      studentId
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada' });
    }
    
    if (session.status !== 'in-progress') {
      return res.status(400).json({ message: 'Sessão não está em andamento' });
    }
    
    // Atualizar exercícios
    if (exercises) {
      session.exercises = exercises;
      
      // Calcular exercícios completados
      const completedCount = exercises.filter(ex => ex.completed).length;
      session.completedExercises = completedCount;
    }
    
    if (notes) {
      session.notes = notes;
    }

    // Armazenar índice do exercício atual
    if (typeof currentExerciseIndex !== 'undefined') {
      session.currentExerciseIndex = currentExerciseIndex;
    }
    
    await session.save();
    
    res.json({
      message: 'Progresso atualizado',
      session
    });
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    res.status(500).json({ message: 'Erro ao atualizar progresso' });
  }
};

// Finalizar sessão de treino
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { exercises, notes } = req.body;
    const userId = req.user.id;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    
    const session = await WorkoutSession.findOne({
      _id: sessionId,
      studentId
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada' });
    }
    
    if (session.status !== 'in-progress') {
      return res.status(400).json({ message: 'Sessão não está em andamento' });
    }
    
    // Atualizar dados finais
    session.exercises = exercises;
    session.status = 'completed';
    session.endTime = new Date();
    session.notes = notes || session.notes;
    
    const completedCount = exercises.filter(ex => ex.completed).length;
    session.completedExercises = completedCount;
    
    await session.save();
    
    res.json({
      message: 'Treino finalizado com sucesso',
      session
    });
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error);
    res.status(500).json({ message: 'Erro ao finalizar treino' });
  }
};

// Cancelar sessão de treino
exports.cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    
    const session = await WorkoutSession.findOne({
      _id: sessionId,
      studentId
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada' });
    }
    
    if (session.status !== 'in-progress') {
      return res.status(400).json({ message: 'Sessão não está em andamento' });
    }
    
    session.status = 'cancelled';
    session.endTime = new Date();
    
    await session.save();
    
    res.json({
      message: 'Sessão cancelada',
      session
    });
  } catch (error) {
    console.error('Erro ao cancelar sessão:', error);
    res.status(500).json({ message: 'Erro ao cancelar sessão' });
  }
};

// Buscar histórico de treinos
exports.getSessionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1 } = req.query;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    
    const sessions = await WorkoutSession.find({
      studentId,
      status: { $in: ['completed', 'cancelled'] }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .populate('workoutPlanId');
    
    const total = await WorkoutSession.countDocuments({
      studentId,
      status: { $in: ['completed', 'cancelled'] }
    });
    
    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico de treinos' });
  }
};

module.exports = exports;
