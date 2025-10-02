const WorkoutPlan = require("../models/workoutPlan");
const Instructor = require("../models/instructor");

exports.createWorkoutPlan = async (req, res) => {
  const { studentId } = req.params;
  const { week, exercises } = req.body;

  try {
    const workoutPlan = new WorkoutPlan({ studentId, week, exercises });
    await workoutPlan.save();
    res.status(201).json({ message: "Ficha de treino criada com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar ficha de treino." });
  }
};

exports.createInstructor = async (req, res) => {
  try {
    const { 
      userId, 
      cref,
      yearsOfExperience,
      bio,
      certifications, 
      specialties,
      availability,
      maxStudents,
      students 
    } = req.body;

    // Validações básicas
    if (!userId) {
      return res.status(400).json({ message: "userId é obrigatório" });
    }

    if (!yearsOfExperience || yearsOfExperience < 0) {
      return res.status(400).json({ message: "Anos de experiência inválido" });
    }

    if (!bio || bio.length < 50) {
      return res.status(400).json({ message: "Biografia deve ter pelo menos 50 caracteres" });
    }

    if (!certifications || certifications.length === 0) {
      return res.status(400).json({ message: "Pelo menos uma certificação é obrigatória" });
    }

    if (!specialties || specialties.length === 0) {
      return res.status(400).json({ message: "Pelo menos uma especialização é obrigatória" });
    }

    if (!availability || !availability.workingDays || availability.workingDays.length === 0) {
      return res.status(400).json({ message: "Defina pelo menos um dia de trabalho" });
    }

    // Verifica se o usuário já é instrutor
    const existingInstructor = await Instructor.findOne({ userId });
    if (existingInstructor) {
      return res.status(400).json({ message: "Usuário já é instrutor" });
    }

    // Busca dados do usuário para incluir no instrutor
    const User = require("../models/user");
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Cria o instrutor
    const newInstructor = new Instructor({
      userId,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      cref: cref || null,
      yearsOfExperience,
      bio,
      certifications,
      specialties,
      availability: {
        workingDays: availability.workingDays,
        startTime: availability.startTime || '08:00',
        endTime: availability.endTime || '18:00'
      },
      maxStudents: maxStudents || 20,
      students: students || []
    });

    await newInstructor.save();

    // Se houver alunos selecionados, atualiza o campo instructorId deles
    if (students && students.length > 0) {
      const Student = require("../models/student");
      
      await Student.updateMany(
        { _id: { $in: students } },
        { $set: { instructorId: newInstructor._id } }
      );
    }

    // Popula dados para retornar
    const populatedInstructor = await Instructor.findById(newInstructor._id)
      .populate('userId', 'name email')
      .populate('students', 'name email cpf');

    res.status(201).json({ 
      message: "Instrutor criado com sucesso!", 
      instructor: populatedInstructor 
    });
  } catch (error) {
    console.error('Erro ao criar instrutor:', error);
    res.status(500).json({ 
      message: "Erro ao criar instrutor", 
      error: error.message 
    });
  }
};

exports.getWorkoutPlans = async (req, res) => {
  const { studentId } = req.params;

  try {
    const workoutPlans = await WorkoutPlan.find({ studentId });
    res.status(200).json(workoutPlans);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar fichas de treino." });
  }
};

exports.getInstructorById = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await Instructor.findById(instructorId)
      .populate("userId", "name email phone birthDate avatar")
      .populate("gym", "name")
      .select("-__v");

    if (!instructor) {
      return res.status(404).json({ message: "Instrutor não encontrado." });
    }

    res.status(200).json(instructor);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar instrutor.", error: error.message });
  }
};

exports.getInstructorByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const instructor = await Instructor.findOne({ userId })
      .populate("userId", "name email phone birthDate avatar")
      .populate("gymId", "name")
      .select("-__v");

    if (!instructor) {
      return res.status(404).json({ message: "Instrutor não encontrado para este usuário." });
    }

    res.status(200).json(instructor);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar instrutor.", error: error.message });
  }
};

exports.updateInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { cref, specialization, yearsOfExperience, bio } = req.body;

    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      return res.status(404).json({ message: "Instrutor não encontrado." });
    }

    // Update instructor fields
    if (cref !== undefined) instructor.cref = cref;
    if (yearsOfExperience !== undefined) instructor.yearsOfExperience = yearsOfExperience;
    if (bio !== undefined) instructor.bio = bio;
    
    // Handle specialization - convert from string to array if needed
    if (specialization !== undefined) {
      if (typeof specialization === 'string') {
        instructor.specialties = specialization.split(',').map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(specialization)) {
        instructor.specialties = specialization;
      }
    }

    await instructor.save();

    res.status(200).json({ 
      message: "Instrutor atualizado com sucesso!", 
      instructor 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Erro ao atualizar instrutor.", 
      error: error.message 
    });
  }
};

exports.getInstructors = async (req, res) => {
  try {
    const { name, specialty, location } = req.query;
    const filters = {};

    // Filtrar por nome (busca parcial, case-insensitive)
    if (name) {
      filters["userId.name"] = { $regex: name, $options: "i" };
    }

    // Filtrar por especialidade
    if (specialty) {
      filters.specialty = { $regex: specialty, $options: "i" };
    }

    // Filtrar por localização (ex.: cidade ou bairro)
    if (location) {
      filters["personalInfo.location.city"] = { $regex: location, $options: "i" };
      filters["personalInfo.location.neighborhood"] = { $regex: location, $options: "i" };
    }

    const instructors = await Instructor.find(filters)
      .populate("userId", "name email phone")
      .select("-__v");

    if (!instructors.length) {
      return res.status(404).json({ message: "Nenhum instrutor encontrado." });
    }

    res.status(200).json(instructors);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar instrutores." });
  }
};