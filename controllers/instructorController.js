const WorkoutPlan = require("../models/workoutPlan");

// Função para criar uma ficha de treino
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

// Função para listar fichas de treino de um aluno
exports.getWorkoutPlans = async (req, res) => {
  const { studentId } = req.params;

  try {
    const workoutPlans = await WorkoutPlan.find({ studentId });
    res.status(200).json(workoutPlans);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar fichas de treino." });
  }
};