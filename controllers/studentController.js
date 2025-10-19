const mongoose = require("mongoose");
const Student = require("../models/student");

const normalizeTrainingExperience = (experience) => {
  if (!experience) return null;
  const mapping = {
    'iniciante': 'iniciante',
    'intermediário': 'intermediario', 
    'intermediario': 'intermediario',
    'avançado': 'avancado',
    'avancado': 'avancado',
    'atleta': 'atleta'
  };
  return mapping[experience.toLowerCase()] || experience.toLowerCase();
};

const safeParseJSON = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      let cleanValue = value.trim();
      
      if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
          (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
        cleanValue = cleanValue.slice(1, -1);
      }
      
      cleanValue = cleanValue.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '');
      
      const parsed = JSON.parse(cleanValue);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (error) {
      console.warn('Failed to parse JSON:', { original: value, error: error.message });
      return defaultValue;
    }
  }
  return defaultValue;
};

exports.createStudent = async (req, res) => {
  try {
    const { userId, name, email, cpf, phone, birthDate, personalInfo, healthRestrictions, goals } = req.body;

    if (!userId || !name || !email || !cpf || !phone || !birthDate) {
      return res.status(400).json({ 
        message: "Campos obrigatórios faltando (userId, name, email, cpf, phone, birthDate)." 
      });
    }

    const existingStudent = await Student.findOne({ userId });
    if (existingStudent) {
      return res.status(400).json({ message: "Usuário já é aluno." });
    }

    const duplicateStudent = await Student.findOne({ 
      $or: [{ cpf: cpf.replace(/\D/g, '') }, { email }] 
    });
    if (duplicateStudent) {
      return res.status(400).json({ message: "CPF ou email já cadastrado." });
    }

    const newStudent = new Student({
      userId,
      name,
      email,
      cpf: cpf.replace(/\D/g, ''),
      phone: phone.replace(/\D/g, ''),
      birthDate,
      
      personalInfo: {
        currentWeight: personalInfo?.currentWeight,
        currentHeight: personalInfo?.currentHeight,
        trainingExperience: normalizeTrainingExperience(personalInfo?.trainingExperience),
        
        initialMeasurements: {
          shoulder: personalInfo?.initialMeasurements?.shoulder || null,
          chest: personalInfo?.initialMeasurements?.chest || null,
          arm: personalInfo?.initialMeasurements?.arm || null,
          forearm: personalInfo?.initialMeasurements?.forearm || null,
          waist: personalInfo?.initialMeasurements?.waist || null,
          hip: personalInfo?.initialMeasurements?.hip || null,
          thigh: personalInfo?.initialMeasurements?.thigh || null,
          calf: personalInfo?.initialMeasurements?.calf || null,
          bodyFatPercentage: personalInfo?.initialMeasurements?.bodyFatPercentage || null
        },
        
        address: {
          cep: personalInfo?.address?.cep?.replace(/\D/g, '') || '',
          street: personalInfo?.address?.street || '',
          number: personalInfo?.address?.number || '',
          complement: personalInfo?.address?.complement || '',
          neighborhood: personalInfo?.address?.neighborhood || '',
          city: personalInfo?.address?.city || '',
          state: personalInfo?.address?.state || '',
          country: personalInfo?.address?.country || 'Brasil'
        },
        
        preferences: {
          trainingDays: safeParseJSON(personalInfo?.preferences?.trainingDays, []),
          preferredTimeStart: personalInfo?.preferences?.preferredTimeStart || '',
          preferredTimeEnd: personalInfo?.preferences?.preferredTimeEnd || '',
          preferredTrainingType: personalInfo?.preferences?.preferredTrainingType || '',
          trainingGoalType: personalInfo?.preferences?.trainingGoalType || ''
        },
        
        availability: {
          daysPerWeek: personalInfo?.availability?.daysPerWeek || 3,
          minutesPerSession: personalInfo?.availability?.minutesPerSession || 60,
          flexibleSchedule: personalInfo?.availability?.flexibleSchedule || false
        }
      },
      
      healthRestrictions: {
        hasChronicConditions: healthRestrictions?.hasChronicConditions || false,
        chronicConditions: safeParseJSON(healthRestrictions?.chronicConditions, []),
        
        hasMedications: healthRestrictions?.hasMedications || false,
        medications: safeParseJSON(healthRestrictions?.medications, []),
        
        hasInjuries: healthRestrictions?.hasInjuries || false,
        injuries: safeParseJSON(healthRestrictions?.injuries, []),
        
        hasSurgeries: healthRestrictions?.hasSurgeries || false,
        surgeries: safeParseJSON(healthRestrictions?.surgeries, []),
        
        medicalAuthorization: healthRestrictions?.medicalAuthorization || false,
        authorizationDate: healthRestrictions?.authorizationDate || null,
        doctorContact: {
          name: healthRestrictions?.doctorContact?.name || '',
          specialty: healthRestrictions?.doctorContact?.specialty || '',
          phone: healthRestrictions?.doctorContact?.phone?.replace(/\D/g, '') || '',
          email: healthRestrictions?.doctorContact?.email || ''
        },
        
        smokingStatus: healthRestrictions?.smokingStatus || 'nunca_fumou',
        alcoholConsumption: healthRestrictions?.alcoholConsumption || 'nao_bebe',
        sleepQuality: healthRestrictions?.sleepQuality || 'boa',
        stressLevel: healthRestrictions?.stressLevel || 'baixo',
        
        allergies: safeParseJSON(healthRestrictions?.allergies, []),
        dietaryRestrictions: safeParseJSON(healthRestrictions?.dietaryRestrictions, []),
        generalNotes: healthRestrictions?.generalNotes || '',
        
        emergencyContact: {
          name: healthRestrictions?.emergencyContact?.name || '',
          relationship: healthRestrictions?.emergencyContact?.relationship || '',
          phone: healthRestrictions?.emergencyContact?.phone?.replace(/\D/g, '') || ''
        }
      },
      
      goals: {
        primary: {
          type: goals?.primary?.type || '',
          description: goals?.primary?.description || '',
          targetDate: goals?.primary?.targetDate || null
        },
        weight: {
          initial: goals?.weight?.initial || personalInfo?.currentWeight,
          target: goals?.weight?.target || null,
          monthlyTarget: goals?.weight?.monthlyTarget || null
        },
        bodyComposition: {
          targetBodyFatPercentage: goals?.bodyComposition?.targetBodyFatPercentage || null,
          targetMuscleMass: goals?.bodyComposition?.targetMuscleMass || null
        },
        performance: safeParseJSON(goals?.performance, []),
        personal: safeParseJSON(goals?.personal, []),
        monthlyWorkouts: goals?.monthlyWorkouts || null,
        monthlyCalories: goals?.monthlyCalories || null,
        monthlyHours: goals?.monthlyHours || null
      },
      
      status: "active"
    });

    await newStudent.save();
    
    // Populate userId antes de retornar
    await newStudent.populate('userId', 'email name role');
    
    res.status(201).json({
      message: "Aluno cadastrado com sucesso!",
      student: newStudent
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ 
      message: "Erro ao criar aluno.", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 2. Buscar Aluno por ID
exports.getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log('🔍 getStudentById chamado com ID:', studentId);

    const student = await Student.findById(studentId)
      .populate("userId", "email name cpf phone birthDate avatar")
      .populate("instructorId")
      .populate("currentWorkoutPlanId");

    console.log('📊 Resultado da busca por ID:', student ? 'Encontrado' : 'Não encontrado');

    if (!student) {
      console.log('❌ Aluno não encontrado na collection Student com ID:', studentId);
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    console.log('✅ Aluno encontrado:', student.name);
    res.status(200).json(student);
  } catch (error) {
    console.error('💥 Erro em getStudentById:', error);
    res.status(500).json({ message: "Erro ao buscar aluno.", error: error.message });
  }
};

// 3. Buscar Alunos por InstructorId
exports.getStudentsByInstructorId = async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    console.log('🔍 Buscando alunos para instructorId:', instructorId);
    
    // Buscar o instrutor e popular seus alunos
    const Instructor = require('../models/instructor');
    const instructor = await Instructor.findById(instructorId).populate({
      path: 'students',
      populate: {
        path: 'userId',
        select: 'name email cpf phone birthDate avatar'
      }
    });
    
    if (!instructor) {
      console.log('❌ Instrutor não encontrado:', instructorId);
      return res.status(404).json({ message: "Instrutor não encontrado." });
    }
    
    console.log('✅ Instrutor encontrado:', instructor.name);
    console.log('👥 Total de alunos vinculados:', instructor.students.length);
    
    if (!instructor.students.length) {
      console.log('⚠️ Nenhum aluno vinculado a este instrutor');
      return res.status(404).json({ message: "Nenhum aluno encontrado para este instrutor." });
    }
    
    // Buscar dados completos dos alunos
    const studentIds = instructor.students.map(student => student._id);
    const students = await Student.find({ _id: { $in: studentIds } })
      .populate("userId", "email name cpf phone birthDate avatar")
      .populate("instructorId", "name email")
      .populate("currentWorkoutPlanId", "name description")
      .select("-__v");
    
    console.log('📊 Dados completos de', students.length, 'alunos carregados');
    
    // Adicionar informações extras de cada aluno
    const enrichedStudents = students.map(student => {
      const studentObj = student.toObject();
      return {
        ...studentObj,
        name: student.userId?.name || 'Nome não disponível',
        email: student.userId?.email || 'Email não disponível',
        avatar: student.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.userId?.name || 'User')}&background=6c5ce7&color=fff`
      };
    });
    
    res.status(200).json(enrichedStudents);
  } catch (error) {
    console.error('💥 Erro ao buscar alunos por instructorId:', error);
    res.status(500).json({ message: "Erro ao buscar alunos.", error: error.message });
  }
};

// 4. Buscar Alunos sem InstructorId
exports.getStudentsWithoutInstructor = async (req, res) => {
  try {
    const students = await Student.find({ instructorId: null })
      .populate("userId", "email name cpf phone birthDate avatar")
      .select("-__v");

    if (!students.length) {
      return res.status(404).json({ message: "Nenhum aluno sem instrutor atribuído." });
    }

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar alunos.", error: error.message });
  }
};

// 5. Atualizar Aluno
exports.updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updateData = {};

    // Campos que podem ser atualizados
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.birthDate) updateData.birthDate = req.body.birthDate;
    if (req.body.instructorId !== undefined) updateData.instructorId = req.body.instructorId;
    if (req.body.status) updateData.status = req.body.status;

    // Atualizar personalInfo (merge com dados existentes)
    if (req.body.personalInfo) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado." });
      }

      updateData.personalInfo = {
        ...student.personalInfo?.toObject(),
        ...req.body.personalInfo,
        address: {
          ...(student.personalInfo?.address?.toObject() || {}),
          ...(req.body.personalInfo.address || {})
        },
        preferences: {
          ...(student.personalInfo?.preferences?.toObject() || {}),
          ...(req.body.personalInfo.preferences || {}),
          trainingDays: req.body.personalInfo.preferences?.trainingDays ? 
            safeParseJSON(req.body.personalInfo.preferences.trainingDays, []) : 
            (student.personalInfo?.preferences?.trainingDays || [])
        },
        availability: {
          ...(student.personalInfo?.availability?.toObject() || {}),
          ...(req.body.personalInfo.availability || {})
        }
      };
    }

    // Atualizar healthRestrictions (merge com dados existentes)
    if (req.body.healthRestrictions) {
      const student = await Student.findById(studentId);
      
      // Parse arrays que podem vir como strings JSON
      const healthRestrictionsData = { ...req.body.healthRestrictions };
      if (healthRestrictionsData.chronicConditions !== undefined) {
        healthRestrictionsData.chronicConditions = safeParseJSON(healthRestrictionsData.chronicConditions, []);
      }
      if (healthRestrictionsData.medications !== undefined) {
        healthRestrictionsData.medications = safeParseJSON(healthRestrictionsData.medications, []);
      }
      if (healthRestrictionsData.injuries !== undefined) {
        healthRestrictionsData.injuries = safeParseJSON(healthRestrictionsData.injuries, []);
      }
      if (healthRestrictionsData.surgeries !== undefined) {
        healthRestrictionsData.surgeries = safeParseJSON(healthRestrictionsData.surgeries, []);
      }
      if (healthRestrictionsData.allergies !== undefined) {
        healthRestrictionsData.allergies = safeParseJSON(healthRestrictionsData.allergies, []);
      }
      if (healthRestrictionsData.dietaryRestrictions !== undefined) {
        healthRestrictionsData.dietaryRestrictions = safeParseJSON(healthRestrictionsData.dietaryRestrictions, []);
      }
      
      updateData.healthRestrictions = {
        ...(student.healthRestrictions?.toObject() || {}),
        ...healthRestrictionsData,
        doctorContact: {
          ...(student.healthRestrictions?.doctorContact?.toObject() || {}),
          ...(req.body.healthRestrictions.doctorContact || {})
        },
        emergencyContact: {
          ...(student.healthRestrictions?.emergencyContact?.toObject() || {}),
          ...(req.body.healthRestrictions.emergencyContact || {})
        }
      };
    }

    // Atualizar goals (merge com dados existentes)
    if (req.body.goals) {
      const student = await Student.findById(studentId);
      
      // Parse arrays que podem vir como strings JSON
      const goalsData = { ...req.body.goals };
      if (goalsData.performance !== undefined) {
        goalsData.performance = safeParseJSON(goalsData.performance, []);
      }
      if (goalsData.personal !== undefined) {
        goalsData.personal = safeParseJSON(goalsData.personal, []);
      }
      
      updateData.goals = {
        ...(student.goals?.toObject() || {}),
        ...goalsData,
        primary: {
          ...(student.goals?.primary?.toObject() || {}),
          ...(goalsData.primary || {})
        },
        weight: {
          ...(student.goals?.weight?.toObject() || {}),
          ...(goalsData.weight || {})
        },
        bodyComposition: {
          ...(student.goals?.bodyComposition?.toObject() || {}),
          ...(goalsData.bodyComposition || {})
        }
      };
    }

    // Compatibilidade com estrutura antiga (preferences na raiz)
    if (req.body.preferences && !req.body.personalInfo) {
      updateData['personalInfo.preferences.trainingDays'] = safeParseJSON(req.body.preferences.trainingDays, []);
      updateData['personalInfo.preferences.preferredTime'] = req.body.preferences.preferredTime || "";
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true }
    ).populate("userId", "email name cpf phone birthDate avatar");

    if (!updatedStudent) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error);
    res.status(500).json({ message: "Erro ao atualizar aluno.", error: error.message });
  }
};

// 6. Adicionar Registro de Progresso
exports.addProgressLog = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { weight, measurements, bodyFatPercentage, notes } = req.body;

    console.log('📊 Recebendo dados de progresso:');
    console.log('Weight:', weight);
    console.log('Body Fat:', bodyFatPercentage);
    console.log('Measurements:', JSON.stringify(measurements, null, 2));
    console.log('Notes:', notes);

    // Validação flexível - pelo menos um campo deve estar preenchido
    if (!weight && !measurements && !bodyFatPercentage) {
      return res.status(400).json({ message: "Informe pelo menos peso, percentual de gordura ou medidas." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    const progressEntry = {
      date: new Date()
    };

    if (weight) progressEntry.weight = weight;
    if (bodyFatPercentage) progressEntry.bodyFatPercentage = bodyFatPercentage;
    if (measurements) progressEntry.measurements = measurements;
    if (notes) progressEntry.notes = notes;

    console.log('📝 Entry antes de salvar:', JSON.stringify(progressEntry, null, 2));

    student.progressHistory.push(progressEntry);

    await student.save();
    
    console.log('✅ Progresso salvo com sucesso!');
    console.log('Progress History Length:', student.progressHistory.length);
    
    // Buscar o documento atualizado para confirmar
    const updatedStudent = await Student.findById(studentId);
    const lastEntry = updatedStudent.progressHistory[updatedStudent.progressHistory.length - 1];
    console.log('🔍 Última entrada salva no banco:', JSON.stringify(lastEntry, null, 2));
    
    res.status(200).json(student);
  } catch (error) {
    console.error('❌ Erro ao salvar progresso:', error);
    res.status(500).json({ message: "Erro ao registrar progresso.", error: error.message });
  }
};

// 7. Atualizar Status de uma Meta
exports.updateGoalStatus = async (req, res) => {
  try {
    const { studentId, goalId } = req.params;
    const { status } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    const goal = student.goals.id(goalId);
    if (!goal) {
      return res.status(404).json({ message: "Meta não encontrada." });
    }

    goal.status = status;
    await student.save();

    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar status da meta.", error: error.message });
  }
};

// 8. Buscar Aluno por UserId
exports.getStudentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔍 getStudentByUserId chamado com userId:', userId);

    const student = await Student.findOne({ userId })
      .populate("userId", "email name cpf phone birthDate avatar")
      .populate({
        path: "instructorId",
        populate: {
          path: "userId",
          select: "name email avatar"
        }
      })
      .populate("currentWorkoutPlanId");

    console.log('📊 Resultado da busca por userId:', student ? 'Encontrado' : 'Não encontrado');

    if (!student) {
      console.log('❌ Aluno não encontrado na collection Student com userId:', userId);
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    console.log('✅ Aluno encontrado:', student.name, '- InstructorId:', student.instructorId?._id || student.instructorId);
    
    // Debug: verificar se o populate aninhado funcionou
    if (student.instructorId) {
      console.log('🔍 Debug instructorId:', {
        id: student.instructorId._id,
        name: student.instructorId.name,
        hasUserId: !!student.instructorId.userId,
        userIdType: typeof student.instructorId.userId,
        userIdIsObject: typeof student.instructorId.userId === 'object',
        userIdKeys: student.instructorId.userId && typeof student.instructorId.userId === 'object' 
          ? Object.keys(student.instructorId.userId) 
          : 'N/A'
      });
    }
    
    res.status(200).json(student);
  } catch (error) {
    console.error('💥 Erro em getStudentByUserId:', error);
    res.status(500).json({ message: "Erro ao buscar aluno por userId.", error: error.message });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    console.log('🔍 getStudents - req.user:', req.user);
    
    // FILTRAR SEMPRE pelo instrutor logado (do token JWT)
    const instructorId = req.user?.instructorId || req.user?._id;
    
    if (!instructorId) {
      return res.status(401).json({ message: "Instrutor não autenticado." });
    }
    
    console.log('👨‍🏫 Filtrando alunos do instrutor:', instructorId);
    
    const { search, limit } = req.query;
    let query = { instructorId }; // SEMPRE filtrar por instrutor
    
    // Se houver busca, criar filtro para nome, email ou CPF
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const cpfSearch = search.replace(/\D/g, ''); // Remove formatação do CPF
      
      query = {
        instructorId, // Manter filtro do instrutor
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { cpf: cpfSearch }
        ]
      };
    }
    
    let studentsQuery = Student.find(query).populate('userId instructorId');
    
    // Aplicar limite se especificado
    if (limit) {
      studentsQuery = studentsQuery.limit(parseInt(limit));
    }
    
    const students = await studentsQuery;
    console.log('✅ Alunos encontrados:', students.length);
    res.status(200).json(students);
  } catch (error) {
    console.error('❌ Erro ao buscar alunos:', error);
    res.status(500).json({ message: "Erro ao buscar alunos.", error: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByIdAndDelete(studentId);
    
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    res.status(200).json({ message: "Aluno removido com sucesso." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao remover aluno.", error: error.message });
  }
};

// Unassign instructor from student
exports.unassignInstructor = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByIdAndUpdate(
      studentId,
      { instructorId: null },
      { new: true }
    );
    
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    res.status(200).json({ message: "Instrutor desvinculado com sucesso.", student });
  } catch (error) {
    res.status(500).json({ message: "Erro ao desvincular instrutor.", error: error.message });
  }
};

// Get comprehensive student profile with analytics
exports.getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const WorkoutSession = require('../models/workoutSession');
    const WorkoutPlan = require('../models/workoutPlan');

    // Find student with all relationships
    const student = await Student.findById(studentId)
      .populate('userId', 'email name role')
      .populate('instructorId', 'name email phone')
      .populate('gymId', 'name address')
      .populate('currentWorkoutPlanId')
      .populate('workoutPlans');

    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    // Get all workout sessions
    const workoutSessions = await WorkoutSession.find({ studentId })
      .populate('workoutPlanId', 'name')
      .sort({ startTime: -1 })
      .limit(100);

    // Calculate statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Sessions by period
    const sessionsLast30Days = workoutSessions.filter(s => new Date(s.startTime) >= thirtyDaysAgo);
    const sessionsLast7Days = workoutSessions.filter(s => new Date(s.startTime) >= sevenDaysAgo);
    const sessionsThisMonth = workoutSessions.filter(s => new Date(s.startTime) >= startOfMonth);
    const sessionsLastMonth = workoutSessions.filter(s => {
      const date = new Date(s.startTime);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });

    // Completed sessions
    const completedSessions = workoutSessions.filter(s => s.status === 'completed');
    const completedLast30Days = sessionsLast30Days.filter(s => s.status === 'completed');
    const completedLast7Days = sessionsLast7Days.filter(s => s.status === 'completed');
    const completedThisMonth = sessionsThisMonth.filter(s => s.status === 'completed');
    const completedLastMonth = sessionsLastMonth.filter(s => s.status === 'completed');

    // Calculate total time and calories
    const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const estimatedCalories = Math.round(totalMinutes * 8); // ~8 cal/min average

    const minutesLast30Days = completedLast30Days.reduce((sum, s) => sum + (s.duration || 0), 0);
    const caloriesLast30Days = Math.round(minutesLast30Days * 8);

    // Current streak calculation
    let currentStreak = 0;
    if (completedSessions.length > 0) {
      const sortedSessions = [...completedSessions].sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );
      
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      for (const session of sortedSessions) {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((checkDate - sessionDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          currentStreak++;
          checkDate = new Date(sessionDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Workout frequency analysis
    const workoutFrequency = {
      daily: {},
      weekly: {}
    };

    completedLast30Days.forEach(session => {
      const date = new Date(session.startTime);
      const dayKey = date.toISOString().split('T')[0];
      workoutFrequency.daily[dayKey] = (workoutFrequency.daily[dayKey] || 0) + 1;
      
      const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      workoutFrequency.weekly[weekDay] = (workoutFrequency.weekly[weekDay] || 0) + 1;
    });

    // Progress history analysis
    const progressHistory = student.progressHistory || [];
    const latestProgress = progressHistory.length > 0 ? progressHistory[0] : null;
    const firstProgress = progressHistory.length > 0 ? progressHistory[progressHistory.length - 1] : null;

    let progressChanges = null;
    if (latestProgress && firstProgress && latestProgress._id !== firstProgress._id) {
      progressChanges = {
        weight: latestProgress.weight && firstProgress.weight 
          ? (latestProgress.weight - firstProgress.weight).toFixed(1)
          : null,
        bodyFat: latestProgress.bodyFatPercentage && firstProgress.bodyFatPercentage
          ? (latestProgress.bodyFatPercentage - firstProgress.bodyFatPercentage).toFixed(1)
          : null,
        muscleMass: latestProgress.muscleMass && firstProgress.muscleMass
          ? (latestProgress.muscleMass - firstProgress.muscleMass).toFixed(1)
          : null,
        timeSpan: Math.floor((new Date(latestProgress.date) - new Date(firstProgress.date)) / (1000 * 60 * 60 * 24))
      };
    }

    // Goals analysis
    const goals = student.goals || {};
    const achievedGoals = (goals.personal || []).filter(g => g.achieved).length;
    const totalPersonalGoals = (goals.personal || []).length;
    const achievedPerformanceGoals = (goals.performance || []).filter(g => g.achieved).length;
    const totalPerformanceGoals = (goals.performance || []).length;

    // Monthly goals progress
    const monthlyGoals = {
      workouts: {
        target: goals.monthlyWorkouts || null,
        current: completedThisMonth.length,
        percentage: goals.monthlyWorkouts ? Math.round((completedThisMonth.length / goals.monthlyWorkouts) * 100) : null
      },
      hours: {
        target: goals.monthlyHours || null,
        current: parseFloat((sessionsThisMonth.reduce((sum, s) => sum + (s.duration || 0), 0) / 60).toFixed(1)),
        percentage: goals.monthlyHours ? Math.round((sessionsThisMonth.reduce((sum, s) => sum + (s.duration || 0), 0) / 60 / goals.monthlyHours) * 100) : null
      },
      calories: {
        target: goals.monthlyCalories || null,
        current: Math.round(sessionsThisMonth.reduce((sum, s) => sum + (s.duration || 0), 0) * 8),
        percentage: goals.monthlyCalories ? Math.round((sessionsThisMonth.reduce((sum, s) => sum + (s.duration || 0), 0) * 8 / goals.monthlyCalories) * 100) : null
      }
    };

    // Activity timeline (last 14 days)
    const activityTimeline = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySessions = completedSessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= date && sessionDate < nextDate;
      });
      
      activityTimeline.push({
        date: date.toISOString().split('T')[0],
        workouts: daySessions.length,
        minutes: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        hasActivity: daySessions.length > 0
      });
    }

    // Recent sessions with details
    const recentSessions = workoutSessions.slice(0, 10).map(session => ({
      id: session._id,
      workoutName: session.workoutName,
      divisionName: session.divisionName,
      date: session.startTime,
      duration: session.duration,
      status: session.status,
      completedExercises: session.completedExercises,
      totalExercises: session.totalExercises,
      completionRate: session.totalExercises > 0 
        ? Math.round((session.completedExercises / session.totalExercises) * 100)
        : 0
    }));

    // Comparison with last month
    const comparison = {
      workouts: completedThisMonth.length - completedLastMonth.length,
      workoutsPercentage: completedLastMonth.length > 0 
        ? Math.round(((completedThisMonth.length - completedLastMonth.length) / completedLastMonth.length) * 100)
        : 0,
      averageWorkoutsPerWeek: (completedLast30Days.length / 4.3).toFixed(1)
    };

    // Build comprehensive response
    const profileData = {
      // Student basic info
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        birthDate: student.birthDate,
        age: student.age,
        cpf: student.cpf,
        status: student.status,
        createdAt: student.createdAt,
        instructor: student.instructorId ? {
          id: student.instructorId._id,
          name: student.instructorId.name,
          email: student.instructorId.email,
          phone: student.instructorId.phone
        } : null,
        gym: student.gymId ? {
          id: student.gymId._id,
          name: student.gymId.name,
          address: student.gymId.address
        } : null
      },

      // Personal information
      personalInfo: {
        currentWeight: student.personalInfo?.currentWeight,
        currentHeight: student.personalInfo?.currentHeight,
        bmi: student.bmi,
        trainingExperience: student.personalInfo?.trainingExperience,
        address: student.personalInfo?.address,
        preferences: student.personalInfo?.preferences,
        availability: student.personalInfo?.availability
      },

      // Health information
      healthInfo: {
        hasRestrictions: student.healthRestrictions?.hasChronicConditions || 
                        student.healthRestrictions?.hasInjuries ||
                        student.healthRestrictions?.hasMedications,
        chronicConditions: student.healthRestrictions?.chronicConditions || [],
        injuries: student.healthRestrictions?.injuries || [],
        medications: student.healthRestrictions?.medications || [],
        allergies: student.healthRestrictions?.allergies || [],
        emergencyContact: student.healthRestrictions?.emergencyContact
      },

      // Goals and targets
      goals: {
        primary: goals.primary || {},
        weight: goals.weight || {},
        bodyComposition: goals.bodyComposition || {},
        performance: goals.performance || [],
        personal: goals.personal || [],
        monthly: monthlyGoals,
        summary: {
          totalPersonalGoals,
          achievedPersonalGoals: achievedGoals,
          personalGoalsPercentage: totalPersonalGoals > 0 
            ? Math.round((achievedGoals / totalPersonalGoals) * 100) 
            : 0,
          totalPerformanceGoals,
          achievedPerformanceGoals,
          performanceGoalsPercentage: totalPerformanceGoals > 0
            ? Math.round((achievedPerformanceGoals / totalPerformanceGoals) * 100)
            : 0
        }
      },

      // Workout statistics
      statistics: {
        allTime: {
          totalWorkouts: completedSessions.length,
          totalHours: parseFloat(totalHours),
          totalCalories: estimatedCalories,
          currentStreak: currentStreak,
          averageWorkoutsPerWeek: (completedSessions.length / Math.max(1, Math.ceil(completedSessions.length > 0 ? (now - new Date(completedSessions[completedSessions.length - 1].startTime)) / (7 * 24 * 60 * 60 * 1000) : 1))).toFixed(1)
        },
        last30Days: {
          totalWorkouts: completedLast30Days.length,
          totalHours: (minutesLast30Days / 60).toFixed(1),
          totalCalories: caloriesLast30Days,
          averageWorkoutsPerWeek: (completedLast30Days.length / 4.3).toFixed(1),
          averageDuration: completedLast30Days.length > 0 
            ? Math.round(minutesLast30Days / completedLast30Days.length)
            : 0
        },
        last7Days: {
          totalWorkouts: completedLast7Days.length,
          averageWorkoutsPerWeek: completedLast7Days.length
        },
        thisMonth: {
          totalWorkouts: completedThisMonth.length,
          comparison: comparison
        },
        frequency: workoutFrequency
      },

      // Progress tracking
      progress: {
        latest: latestProgress,
        history: progressHistory.slice(0, 12), // Last 12 entries
        changes: progressChanges,
        chartData: progressHistory.slice(0, 12).reverse().map(p => ({
          date: p.date,
          weight: p.weight,
          bodyFat: p.bodyFatPercentage,
          muscleMass: p.muscleMass
        }))
      },

      // Activity data
      activity: {
        timeline: activityTimeline,
        recentSessions: recentSessions,
        mostActiveDay: Object.entries(workoutFrequency.weekly).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
        mostActiveDayCount: Object.entries(workoutFrequency.weekly).sort((a, b) => b[1] - a[1])[0]?.[1] || 0
      },

      // Current workout plan
      currentWorkoutPlan: student.currentWorkoutPlanId ? {
        id: student.currentWorkoutPlanId._id,
        name: student.currentWorkoutPlanId.name,
        divisions: student.currentWorkoutPlanId.divisions,
        createdAt: student.currentWorkoutPlanId.createdAt
      } : null,

      // All workout plans
      workoutPlans: student.workoutPlans.map(plan => ({
        id: plan._id,
        name: plan.name,
        divisionsCount: plan.divisions?.length || 0,
        createdAt: plan.createdAt
      }))
    };

    res.status(200).json(profileData);
  } catch (error) {
    console.error("Error getting student profile:", error);
    res.status(500).json({ 
      message: "Erro ao buscar perfil do aluno.", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Atribuir plano de treino ao aluno (com sincronização bidirecional)
exports.assignWorkoutPlanToStudent = async (req, res) => {
  const { studentId } = req.params;
  const { workoutPlanId } = req.body;

  try {
    const WorkoutPlan = require("../models/workoutPlan");

    // Verifica se o aluno existe
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    // Verifica se o plano de treino existe
    const workoutPlan = await WorkoutPlan.findById(workoutPlanId);
    if (!workoutPlan) {
      return res.status(404).json({ message: "Plano de treino não encontrado." });
    }

    // Remove o aluno do plano anterior (se existir)
    if (student.workoutPlanId && student.workoutPlanId.toString() !== workoutPlanId) {
      await WorkoutPlan.findByIdAndUpdate(
        student.workoutPlanId,
        { $pull: { assignedStudents: studentId } }
      );
    }

    // Atualiza o aluno com o novo plano
    student.workoutPlanId = workoutPlanId;
    await student.save();

    // Adiciona o aluno à lista de assignedStudents do novo plano (se ainda não estiver)
    if (!workoutPlan.assignedStudents.includes(studentId)) {
      workoutPlan.assignedStudents.push(studentId);
      await workoutPlan.save();
    }

    res.status(200).json({ 
      message: "Ficha de treino atribuída com sucesso!",
      student: {
        id: student._id,
        name: student.name,
        workoutPlanId: student.workoutPlanId
      },
      workoutPlan: {
        id: workoutPlan._id,
        name: workoutPlan.name,
        studentsCount: workoutPlan.assignedStudents.length
      }
    });
  } catch (error) {
    console.error('Erro ao atribuir plano:', error);
    res.status(500).json({ message: "Erro interno ao atribuir ficha de treino." });
  }
};