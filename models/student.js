const mongoose = require("mongoose");

// Registro de evolução física do aluno (peso, medidas, composição corporal)
const ProgressLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  
  // Peso e Composição Corporal
  weight: { type: Number }, // kg
  bodyFatPercentage: { type: Number }, // %
  muscleMass: { type: Number }, // kg
  
  // Circunferências (cm)
  measurements: {
    chest: { type: Number, alias: 'peitoral' },      // Peitoral
    waist: { type: Number, alias: 'cintura' },       // Cintura
    abdomen: { type: Number, alias: 'abdomen' },     // Abdômen
    hips: { type: Number, alias: 'quadril' },        // Quadril
    rightArm: { type: Number, alias: 'bracoDireito' },   // Braço direito
    leftArm: { type: Number, alias: 'bracoEsquerdo' },   // Braço esquerdo
    rightThigh: { type: Number, alias: 'coxaDireita' },  // Coxa direita
    leftThigh: { type: Number, alias: 'coxaEsquerda' },  // Coxa esquerda
    rightCalf: { type: Number, alias: 'panturrilhaDireita' },  // Panturrilha direita
    leftCalf: { type: Number, alias: 'panturrilhaEsquerda' }   // Panturrilha esquerda
  },
  
  // Força (cargas máximas ou testes)
  strengthTests: {
    benchPress: { type: Number, alias: 'supino' },      // Supino (kg)
    squat: { type: Number, alias: 'agachamento' },      // Agachamento (kg)
    deadlift: { type: Number, alias: 'levantamentoTerra' }, // Levantamento Terra (kg)
    pullUp: { type: Number, alias: 'barraFixa' },       // Barra fixa (reps)
    plank: { type: Number, alias: 'prancha' }           // Prancha (segundos)
  },
  
  // Observações e contexto
  notes: String,
  measuredBy: { type: String, enum: ['instrutor', 'aluno', 'nutricionista'] },
  photoUrls: [String] // URLs de fotos de progresso
});

// WorkoutSummary: Resumo estatístico dos treinos (cache de 30 dias)
// Para histórico completo de treinos executados, usar WorkoutSession collection
const WorkoutSummarySchema = new mongoose.Schema({
  workoutSessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "WorkoutSession" 
  }, // Referência ao treino completo
  workoutPlanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "WorkoutPlan" 
  },
  date: { type: Date, default: Date.now },
  duration: Number, // Duração em minutos
  exercisesCompleted: Number, // Quantidade de exercícios completados
  totalExercises: Number, // Total de exercícios no treino
  status: {
    type: String,
    enum: ["completed", "partial", "missed", "cancelled"],
    default: "missed"
  }
});

const StudentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor"
  },
  currentWorkoutPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkoutPlan"
  },
  workoutPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkoutPlan"
  }],
  personalInfo: {
    weight: Number,
    height: Number,
    trainingExperience: {
      type: String,
      enum: ["iniciante", "intermediario", "avancado", "atleta"]
    },
    location: {
      city: String,
      neighborhood: String,
      street: String,
      number: String,
      postalCode: String
    },
    preferences: {
      trainingDays: [String],  // ["segunda", "quarta", "sexta"]
      preferredTimes: [String] // ["07:00", "18:00"]
    }
  },
  healthRestrictions: {
    chronicConditions: [String],
    medications: [String],
    medicalAuthorization: Boolean,
    doctorContact: String,
    notes: String
  },
  goals: [
    {
      description: String,
      targetValue: Number,
      targetDate: Date,
      achieved: { type: Boolean, default: false }
    }
  ],
  
  // Evolução física (peso, medidas, força)
  progressHistory: [ProgressLogSchema],
  
  // Resumo dos últimos treinos executados (cache)
  workoutSummary: [WorkoutSummarySchema],
  
  status: {
    type: String,
    enum: ["active", "paused", "inactive"],
    default: "active"
  }
});

module.exports = mongoose.model("Student", StudentSchema);