const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome do exercício
  description: String, // Descrição
  image: String, // URL da imagem
  sets: { type: Number, required: true }, // Número de séries
  reps: { type: Number, required: true }, // Repetições
  idealWeight: { type: Number, required: true }, // Carga ideal
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" }, // Referência ao equipamento (opcional)
});

const WorkoutDivisionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome da divisão (ex.: Treino A, Treino B)
  exercises: [ExerciseSchema], // Lista de exercícios
});

const WorkoutPlanSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome da ficha (ex.: "Ficha de Hipertrofia")
  divisions: [WorkoutDivisionSchema], // Divisões de treino (A, B, etc.)
  createdAt: { type: Date, default: Date.now }, // Data de criação
});

module.exports = mongoose.model("WorkoutPlan", WorkoutPlanSchema);