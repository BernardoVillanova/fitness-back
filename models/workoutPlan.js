const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome do exercício
  description: String, // Descrição
  image: String, // URL da imagem
  sets: { type: Number, required: true }, // Número de séries
  reps: { type: Number, required: true }, // Repetições
  idealWeight: { type: Number, required: true }, // Carga ideal em kg
  restTime: { type: Number, default: 60 }, // Tempo de descanso em segundos
  toFailure: { type: Boolean, default: false }, // Ir até a falha
  notes: String, // Observações sobre o exercício
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" }, // Referência ao equipamento (opcional)
});

const WorkoutDivisionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome da divisão (ex.: Treino A, Treino B)
  description: String, // Descrição da divisão
  muscleGroups: [String], // Grupos musculares trabalhados (ex: ["Peito", "Tríceps", "Ombro"])
  exercises: [ExerciseSchema], // Lista de exercícios
});

const WorkoutPlanSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome da ficha (ex.: "Ficha de Hipertrofia")
  description: String, // Descrição do plano
  goal: String, // Objetivo (hipertrofia, emagrecimento, condicionamento, força)
  divisions: [WorkoutDivisionSchema], // Divisões de treino (A, B, etc.)
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // Alunos que usam este plano
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" }, // Instrutor criador
  createdAt: { type: Date, default: Date.now }, // Data de criação
  updatedAt: { type: Date, default: Date.now }, // Data de atualização
});

// Atualizar updatedAt antes de salvar
WorkoutPlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("WorkoutPlan", WorkoutPlanSchema);