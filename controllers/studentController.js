const mongoose = require("mongoose");
const Student = require("../models/student");
const User = require("../models/user");

// Listar todos os alunos com opções de filtro
exports.getStudents = async (req, res) => {
  try {
    const { status, search, hasInstructor } = req.query;
    
    let query = {};
    
    // Filtro por status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filtro por instrutor
    if (hasInstructor === 'true') {
      query.instructorId = { $ne: null };
    } else if (hasInstructor === 'false') {
      query.instructorId = null;
    }
    
    // Busca de texto
    if (search) {
      // Precisamos buscar primeiro os usuários que correspondem à busca
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
      
      const userIds = users.map(user => user._id);
      query.userId = { $in: userIds };
    }

    const students = await Student.find(query)
      .populate('userId', 'name email')
      .populate('instructorId', 'name')
      .populate('currentWorkoutPlanId', 'name');

    res.status(200).json(students);
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    res.status(500).json({ 
      message: "Erro ao buscar alunos.",
      error: error.message
    });
  }
};

// Criar aluno
exports.createStudent = async (req, res) => {
  try {
    console.log('Criando novo aluno:', req.body);
    
    const {
      userId,
      instructorId,
      personalInfo,
      healthRestrictions,
      goals,
      status
    } = req.body;

    // Verificar se já existe um aluno com este userId
    const existingStudent = await Student.findOne({ userId });
    if (existingStudent) {
      return res.status(400).json({
        message: "Este usuário já está registrado como aluno"
      });
    }

    // Criar novo aluno
    const newStudent = new Student({
      userId,
      instructorId,
      personalInfo: {
        weight: personalInfo?.weight,
        height: personalInfo?.height,
        trainingExperience: personalInfo?.trainingExperience || 'iniciante',
        location: personalInfo?.location || {},
        preferences: personalInfo?.preferences || {}
      },
      healthRestrictions: healthRestrictions || {},
      goals: goals || [],
      status: status || 'active'
    });

    await newStudent.save();

    // Retornar o aluno criado com as referências populadas
    const populatedStudent = await Student.findById(newStudent._id)
      .populate('userId', 'name email')
      .populate('instructorId', 'name');

    res.status(201).json(populatedStudent);
  } catch (error) {
    console.error('Erro ao criar aluno:', error);
    res.status(500).json({
      message: "Erro ao criar aluno",
      error: error.message,
      details: error.errors
    });
  }
};

// Atualizar aluno
exports.updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('Atualizando aluno:', studentId, req.body);

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          instructorId: req.body.instructorId,
          'personalInfo.weight': req.body.personalInfo?.weight,
          'personalInfo.height': req.body.personalInfo?.height,
          'personalInfo.trainingExperience': req.body.personalInfo?.trainingExperience,
          'personalInfo.location': req.body.personalInfo?.location,
          'personalInfo.preferences': req.body.personalInfo?.preferences,
          healthRestrictions: req.body.healthRestrictions,
          goals: req.body.goals,
          status: req.body.status
        }
      },
      { new: true, runValidators: true }
    )
    .populate('userId', 'name email')
    .populate('instructorId', 'name')
    .populate('currentWorkoutPlanId', 'name');

    if (!updatedStudent) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }

    res.json(updatedStudent);
  } catch (error) {
    console.error('Erro ao atualizar aluno:', error);
    res.status(500).json({
      message: "Erro ao atualizar aluno",
      error: error.message
    });
  }
};

// Buscar aluno por ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('userId', 'name email')
      .populate('instructorId', 'name')
      .populate('currentWorkoutPlanId', 'name');

    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }

    res.json(student);
  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    res.status(500).json({
      message: "Erro ao buscar aluno",
      error: error.message
    });
  }
};

// Remover instrutor do aluno
exports.unassignInstructor = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByIdAndUpdate(
      studentId,
      { $unset: { instructorId: "" } },
      { new: true }
    )
    .populate('userId', 'name email');

    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }

    res.json(student);
  } catch (error) {
    console.error('Erro ao remover instrutor:', error);
    res.status(500).json({
      message: "Erro ao remover instrutor do aluno",
      error: error.message
    });
  }
};

// Registrar progresso do aluno
exports.addProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const progressData = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }

    student.progressHistory.push(progressData);
    await student.save();

    res.json(student.progressHistory[student.progressHistory.length - 1]);
  } catch (error) {
    console.error('Erro ao registrar progresso:', error);
    res.status(500).json({
      message: "Erro ao registrar progresso do aluno",
      error: error.message
    });
  }
};

// Deletar aluno
exports.deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }

    await Student.findByIdAndDelete(studentId);

    res.status(200).json({ 
      message: "Aluno deletado com sucesso",
      deletedStudent: student
    });
  } catch (error) {
    console.error('Erro ao deletar aluno:', error);
    res.status(500).json({
      message: "Erro ao deletar aluno",
      error: error.message
    });
  }
};