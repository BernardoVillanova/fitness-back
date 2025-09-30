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
    console.log("Received payload:", JSON.stringify(req.body, null, 2));
    const { userId, personalInfo, healthRestrictions, goals, preferences, status } = req.body;

    // Verificar se o usuário já é aluno
    const existingStudent = await Student.findOne({ userId });
    if (existingStudent) {
      return res.status(400).json({ message: "Usuário já é aluno." });
    }

    const newStudent = new Student({
      userId,
      // instructorId will be assigned later by instructor
      personalInfo: {
        weight: personalInfo?.weight,
        height: personalInfo?.height,
        trainingExperience: normalizeTrainingExperience(personalInfo?.trainingExperience),
        location: {
          city: personalInfo?.location?.city,
          neighborhood: personalInfo?.location?.neighborhood,
          street: personalInfo?.location?.street,
          number: personalInfo?.location?.number,
          postalCode: personalInfo?.location?.cep
        },
        preferences: {
          trainingDays: personalInfo?.availability?.trainingDays || [],
          preferredTimes: [personalInfo?.availability?.preferredTime || ""]
        }
      },
      healthRestrictions: {
        chronicConditions: healthRestrictions?.chronicConditions || [],
        medications: healthRestrictions?.medications || [],
        medicalAuthorization: healthRestrictions?.medicalAuthorization || false,
        doctorContact: healthRestrictions?.doctorContact || "",
        notes: healthRestrictions?.notes || ""
      },
      goals: goals || [],
      status: status || "active"
    });

    console.log("Creating student with data:", JSON.stringify(newStudent, null, 2));
    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ message: "Erro ao criar aluno.", error: error.message });
  }
};

// 2. Buscar Aluno por ID
exports.getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate("userId", "email name cpf phone birthDate")
      .populate("instructorId", "name")
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
    const { instructorId, preferences, status } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        instructorId,
        preferences: {
          trainingDays: preferences?.trainingDays || [],
          preferredTime: preferences?.preferredTime || "",
        },
        status,
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
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
      .populate("instructorId", "name")
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
    const students = await Student.find().populate('userId instructorId');
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