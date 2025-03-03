const WorkoutPlan = require("../models/workoutPlan");
const Student = require("../models/student");

exports.createWorkoutPlan = async (req, res) => {
  const { name, divisions } = req.body;

  // Validação de campos obrigatórios
  if (!name || !divisions) {
    return res.status(400).json({ message: "Nome e divisões são obrigatórios." });
  }

  try {
    const workoutPlan = new WorkoutPlan({ name, divisions });
    await workoutPlan.save();

    res.status(201).json({ message: "Ficha de treino criada com sucesso!" });
  } catch (error) {
    console.error(error); // Log do erro para depuração
    res.status(500).json({ message: "Erro interno ao criar ficha de treino." });
  }
};

exports.getWorkoutPlans = async (req, res) => {
  try {
    // Paginação opcional
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const workoutPlans = await WorkoutPlan.find().skip(skip).limit(limit);
    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error(error); // Log do erro para depuração
    res.status(500).json({ message: "Erro interno ao buscar fichas de treino." });
  }
};

exports.assignWorkoutPlanToStudent = async (req, res) => {
  const { studentId } = req.params;
  const { workoutPlanId } = req.body;

  try {
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

    // Atualiza o aluno com o ID do plano de treino
    student.workoutPlanId = workoutPlanId;
    await student.save();

    res.status(200).json({ message: "Ficha de treino atribuída com sucesso!" });
  } catch (error) {
    console.error(error); // Log do erro para depuração
    res.status(500).json({ message: "Erro interno ao atribuir ficha de treino." });
  }
};