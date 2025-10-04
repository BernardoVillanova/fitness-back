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
      exercises,
      totalExercises: exercises.length,
      completedExercises: 0,
      skippedExercises: 0,
      totalSets,
      completedSets: 0,
      totalVolume: 0,
      studentWeight: student.personalInfo?.currentWeight || null,
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
    console.log('🎯 === INÍCIO COMPLETE SESSION ===');
    console.log('📋 Body completo:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Params:', req.params);
    console.log('👤 User info:', req.user);
    
    const { sessionId } = req.params;
    const { exercises, notes } = req.body;
    const userId = req.user.id;
    
    console.log('✨ Dados extraídos:', { 
      sessionId, 
      userId, 
      exercisesCount: exercises ? exercises.length : 'undefined',
      notes: notes || 'sem notas'
    });
    
    // Buscar aluno pelo userId
    console.log('🔍 Buscando student com userId:', userId);
    const student = await Student.findOne({ userId });
    console.log('👨‍🎓 Student encontrado:', student ? { id: student._id, name: student.name } : 'NÃO ENCONTRADO');
    
    if (!student) {
      console.log('❌ Student não encontrado para userId:', userId);
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    console.log('🆔 StudentId extraído:', studentId);
    
    console.log('🔍 Buscando session com:', { sessionId, studentId });
    const session = await WorkoutSession.findOne({
      _id: sessionId,
      studentId
    });
    
    console.log('📊 Session encontrada:', session ? {
      id: session._id,
      status: session.status,
      studentId: session.studentId,
      exercisesCount: session.exercises ? session.exercises.length : 0
    } : 'NÃO ENCONTRADA');
    
    if (!session) {
      console.log('❌ Session não encontrada');
      return res.status(404).json({ message: 'Sessão não encontrada' });
    }
    
    if (session.status !== 'in-progress') {
      console.log('❌ Status inválido:', session.status);
      return res.status(400).json({ message: 'Sessão não está em andamento' });
    }
    
    console.log('📝 Atualizando session...');
    // Atualizar dados finais
    session.exercises = exercises;
    session.status = 'completed';
    session.endTime = new Date();
    session.notes = notes || session.notes;
    
    const completedCount = exercises ? exercises.filter(ex => ex.completed).length : 0;
    session.completedExercises = completedCount;
    
    console.log('📊 Dados atualizados:', {
      exercisesCount: session.exercises ? session.exercises.length : 0,
      status: session.status,
      completedExercises: session.completedExercises,
      hasEndTime: !!session.endTime
    });
    
    console.log('💾 Salvando session...');
    await session.save();
    console.log('✅ Session salva com sucesso!');
    
    res.json({
      message: 'Treino finalizado com sucesso',
      session
    });
    
    console.log('🎉 === FIM COMPLETE SESSION ===');
  } catch (error) {
    console.error('💥 ERRO COMPLETE SESSION:', error);
    console.error('📍 Stack trace:', error.stack);
    res.status(500).json({ message: 'Erro ao finalizar treino', error: error.message });
  }
};

// Cancelar sessão de treino
exports.cancelSession = async (req, res) => {
  try {
    console.log('🚫 === INÍCIO CANCEL SESSION ===');
    console.log('📋 Params:', req.params);
    console.log('👤 User:', req.user);
    
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    console.log('🔍 Buscando student com userId:', userId);
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      console.log('❌ Student não encontrado');
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    console.log('👨‍🎓 Student encontrado:', studentId);
    
    console.log('🔍 Buscando sessão para deletar:', { sessionId, studentId });
    
    const session = await WorkoutSession.findOne({
      _id: sessionId,
      studentId
    });
    
    if (!session) {
      console.log('❌ Sessão não encontrada');
      return res.status(404).json({ message: 'Sessão não encontrada' });
    }
    
    console.log('📊 Sessão encontrada:', {
      id: session._id,
      status: session.status,
      workoutName: session.workoutName
    });
    
    if (session.status !== 'in-progress') {
      console.log('❌ Status inválido:', session.status);
      return res.status(400).json({ message: 'Sessão não está em andamento' });
    }
    
    console.log('🗑️ Deletando sessão...');
    // Deletar a sessão ao invés de salvar como cancelada
    const deleteResult = await WorkoutSession.findByIdAndDelete(sessionId);
    console.log('✅ Resultado da deleção:', deleteResult ? 'SUCESSO' : 'FALHOU');
    
    console.log('✅ Sessão deletada com sucesso!');
    
    res.json({
      message: 'Sessão cancelada e removida',
      sessionId
    });
    
    console.log('🚫 === FIM CANCEL SESSION ===');
  } catch (error) {
    console.error('💥 ERRO CANCEL SESSION:', error);
    console.error('📍 Stack trace:', error.stack);
    res.status(500).json({ message: 'Erro ao cancelar sessão', error: error.message });
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

// Pular exercício
exports.skipExercise = async (req, res) => {
  try {
    console.log('🦘 === INÍCIO SKIP EXERCISE ===');
    const { sessionId } = req.params;
    const { exerciseIndex, reason } = req.body;
    const userId = req.user.id;
    
    console.log('📋 Dados recebidos:', { sessionId, exerciseIndex, reason, userId });
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const studentId = student._id;
    
    // Buscar sessão
    const session = await WorkoutSession.findOne({
      _id: sessionId,
      studentId,
      status: 'in-progress'
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada ou não está em andamento' });
    }
    
    // Verificar se o índice do exercício é válido
    if (exerciseIndex < 0 || exerciseIndex >= session.exercises.length) {
      return res.status(400).json({ message: 'Índice de exercício inválido' });
    }
    
    // Marcar exercício como pulado
    session.exercises[exerciseIndex].skipped = true;
    session.exercises[exerciseIndex].skipReason = reason || 'Não informado';
    session.exercises[exerciseIndex].completed = false;
    
    await session.save();
    
    console.log('✅ Exercício pulado com sucesso');
    
    res.json({
      message: 'Exercício pulado com sucesso',
      exercise: session.exercises[exerciseIndex]
    });
    
    console.log('🦘 === FIM SKIP EXERCISE ===');
  } catch (error) {
    console.error('💥 ERRO SKIP EXERCISE:', error);
    res.status(500).json({ message: 'Erro ao pular exercício', error: error.message });
  }
};

module.exports = exports;
