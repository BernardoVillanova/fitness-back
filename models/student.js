const mongoose = require("mongoose");

const ProgressLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  weight: Number,
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    thighs: Number, // Adicione mais medidas conforme necessário
    arms: Number,
  },
  bodyFatPercentage: Number, // Opcional, se relevante
  notes: String, // Observações do aluno ou instrutor
});

const WorkoutHistorySchema = new mongoose.Schema({
  workoutPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkoutPlan" },
  date: { type: Date, default: Date.now },
  exercisesCompleted: [
    {
      exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise" },
      sets: Number,
      reps: [Number], // Ex.: [10, 8, 12] para 3 séries
      weightUsed: Number,
      notes: String,
    },
  ],
  status: { 
    type: String, 
    enum: ["completed", "partial", "missed"], 
    default: "missed" 
  }, // Status do treino
});

const StudentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    unique: true // Garante que um usuário só seja aluno uma vez
  },
  instructorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Instructor" 
  },
  currentWorkoutPlanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "WorkoutPlan" 
  },
  goals: [
    {
      description: String, // Ex.: "Perder 5kg em 3 meses"
      startDate: Date,
      endDate: Date,
      targetValue: Number,
      currentValue: Number,
      status: { 
        type: String, 
        enum: ["in-progress", "achieved", "canceled"] 
      }
    },
  ],
  progressHistory: [ProgressLogSchema], // Histórico de medidas
  workoutHistory: [WorkoutHistorySchema], // Histórico de treinos
  preferences: {
    trainingDays: [String], // Ex.: ["segunda", "quarta", "sexta"]
    preferredTime: String, // Ex.: "manhã"
    notifications: { 
      type: Boolean, 
      default: true 
    }, // Receber lembretes
  },
  status: { 
    type: String, 
    enum: ["active", "paused", "inactive"], 
    default: "active" 
  }, // Status da relação aluno-instrutor
});

module.exports = mongoose.model("Student", StudentSchema);