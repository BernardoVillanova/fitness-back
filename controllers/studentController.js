const mongoose = require("mongoose");
const Student = require("../models/student");

// 1. Criar Aluno
exports.createStudent = async (req, res) => {
  try {
    const { userId, instructorId, preferences, status } = req.body;

    // Verificar se o usuário já é aluno
    const existingStudent = await Student.findOne({ userId });
    if (existingStudent) {
      return res.status(400).json({ message: "Usuário já é aluno." });
    }

    const newStudent = new Student({
      userId,
      instructorId,
      preferences: {
        trainingDays: preferences?.trainingDays || [],
        preferredTime: preferences?.preferredTime || "",
        notifications: preferences?.notifications !== undefined ? preferences.notifications : true,
      },
      status: status || "active",
    });

    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar aluno.", error: error.message });
  }
};

// 2. Listar Todos os Alunos
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("userId", "email name") // Exemplo: incluir dados do usuário
      .select("-__v"); // Ocultar versão do documento

    if (!students.length) {
      return res.status(404).json({ message: "Nenhum aluno encontrado." });
    }

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar alunos.", error: error.message });
  }
};

// 3. Buscar Aluno por ID
exports.getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate("userId", "email name")
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

// 4. Atualizar Aluno
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
          notifications: preferences?.notifications !== undefined ? preferences.notifications : true,
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

// 5. Adicionar Registro de Progresso
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

// 6. Atualizar Status de uma Meta
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