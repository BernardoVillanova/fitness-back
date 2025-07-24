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
    const { userId, certifications, specialties } = req.body;

    // Verifica se o usuário já é instrutor
    const existingInstructor = await Instructor.findOne({ userId });
    if (existingInstructor) {
      return res.status(400).json({ message: "Usuário já é instrutor." });
    }

    const newInstructor = new Instructor({
      userId,
      certifications: certifications || [],
      specialties: specialties || [],
    });

    await newInstructor.save();
    res.status(201).json({ message: "Instrutor criado com sucesso.", instructor: newInstructor });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar instrutor.", error: error.message });
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