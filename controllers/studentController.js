const mongoose = require("mongoose");
const Student = require("../models/student");

// Helper function to normalize training experience
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

// 1. Criar Aluno
exports.createStudent = async (req, res) => {
  try {
    const { userId, name, email, cpf, phone, birthDate, personalInfo, healthRestrictions, goals } = req.body;

    // Validar campos obrigatórios
    if (!userId || !name || !email || !cpf || !phone || !birthDate) {
      return res.status(400).json({ 
        message: "Campos obrigatórios faltando (userId, name, email, cpf, phone, birthDate)." 
      });
    }

    // Verificar se o usuário já é aluno
    const existingStudent = await Student.findOne({ userId });
    if (existingStudent) {
      return res.status(400).json({ message: "Usuário já é aluno." });
    }

    // Verificar se CPF ou email já existem
    const duplicateStudent = await Student.findOne({ 
      $or: [{ cpf: cpf.replace(/\D/g, '') }, { email }] 
    });
    if (duplicateStudent) {
      return res.status(400).json({ message: "CPF ou email já cadastrado." });
    }

    // Criar novo aluno com a estrutura atualizada
    const newStudent = new Student({
      userId,
      name,
      email,
      cpf: cpf.replace(/\D/g, ''), // Remove formatação
      phone: phone.replace(/\D/g, ''), // Remove formatação
      birthDate,
      
      // instructorId e gymId serão atribuídos depois
      
      personalInfo: {
        currentWeight: personalInfo?.currentWeight,
        currentHeight: personalInfo?.currentHeight,
        trainingExperience: normalizeTrainingExperience(personalInfo?.trainingExperience),
        
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
          trainingDays: personalInfo?.preferences?.trainingDays || [],
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
        chronicConditions: healthRestrictions?.chronicConditions || [],
        
        hasMedications: healthRestrictions?.hasMedications || false,
        medications: healthRestrictions?.medications || [],
        
        hasInjuries: healthRestrictions?.hasInjuries || false,
        injuries: healthRestrictions?.injuries || [],
        
        hasSurgeries: healthRestrictions?.hasSurgeries || false,
        surgeries: healthRestrictions?.surgeries || [],
        
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
        
        allergies: healthRestrictions?.allergies || [],
        dietaryRestrictions: healthRestrictions?.dietaryRestrictions || [],
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
        performance: goals?.performance || [],
        personal: goals?.personal || [],
        monthlyWorkouts: goals?.monthlyWorkouts || 20,
        monthlyCalories: goals?.monthlyCalories || 5000,
        monthlyHours: goals?.monthlyHours || 40
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

    const student = await Student.findById(studentId)
      .populate("userId", "email name cpf phone birthDate")
      .populate("instructorId")
      .populate("currentWorkoutPlanId");

    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar aluno.", error: error.message });
  }
};

// 3. Buscar Alunos por InstructorId
exports.getStudentsByInstructorId = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const students = await Student.find({ instructorId })
      .populate("userId", "email name cpf phone birthDate")
      .populate("instructorId", "name")
      .select("-__v");

    if (!students.length) {
      return res.status(404).json({ message: "Nenhum aluno encontrado para este instrutor." });
    }

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar alunos.", error: error.message });
  }
};

// 4. Buscar Alunos sem InstructorId
exports.getStudentsWithoutInstructor = async (req, res) => {
  try {
    const students = await Student.find({ instructorId: null })
      .populate("userId", "email name cpf phone birthDate")
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
          ...(req.body.personalInfo.preferences || {})
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
      updateData.healthRestrictions = {
        ...(student.healthRestrictions?.toObject() || {}),
        ...req.body.healthRestrictions,
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
      updateData.goals = {
        ...(student.goals?.toObject() || {}),
        ...req.body.goals,
        primary: {
          ...(student.goals?.primary?.toObject() || {}),
          ...(req.body.goals.primary || {})
        },
        weight: {
          ...(student.goals?.weight?.toObject() || {}),
          ...(req.body.goals.weight || {})
        },
        bodyComposition: {
          ...(student.goals?.bodyComposition?.toObject() || {}),
          ...(req.body.goals.bodyComposition || {})
        }
      };
    }

    // Compatibilidade com estrutura antiga (preferences na raiz)
    if (req.body.preferences && !req.body.personalInfo) {
      updateData['personalInfo.preferences.trainingDays'] = req.body.preferences.trainingDays || [];
      updateData['personalInfo.preferences.preferredTime'] = req.body.preferences.preferredTime || "";
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true }
    ).populate("userId", "email name cpf phone birthDate");

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

    if (!weight || !measurements) {
      return res.status(400).json({ message: "Peso e medidas são obrigatórios." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    student.progressHistory.push({
      weight,
      measurements,
      bodyFatPercentage,
      notes,
    });

    await student.save();
    res.status(200).json(student);
  } catch (error) {
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

    const student = await Student.findOne({ userId })
      .populate("userId", "email name cpf phone birthDate")
      .populate("instructorId")
      .populate("currentWorkoutPlanId");

    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar aluno por userId.", error: error.message });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const { search, limit } = req.query;
    let query = {};
    
    // Se houver busca, criar filtro para nome, email ou CPF
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const cpfSearch = search.replace(/\D/g, ''); // Remove formatação do CPF
      
      query = {
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
    res.status(200).json(students);
  } catch (error) {
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