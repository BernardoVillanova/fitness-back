const mongoose = require('mongoose');

const ExerciseLogSchema = new mongoose.Schema({
  exerciseId: { type: String, required: true },
  exerciseName: { type: String, required: true },
  sets: [{
    setNumber: { type: Number, required: true },
    reps: { type: Number, required: true },
    weight: { type: Number, default: 0 },
    isBodyWeight: { type: Boolean, default: false }, // Indica se é exercício com peso corporal
    actualReps: { type: Number }, // Repetições realmente executadas
    completed: { type: Boolean, default: false },
    completedAt: Date,
    restTimeTaken: { type: Number }, // Tempo de descanso real em segundos
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }, // Dificuldade percebida
    notes: String // Notas específicas do set
  }],
  idealWeight: { type: Number, default: 0 }, // Peso ideal definido pelo instrutor
  restTime: { type: Number, default: 60 }, // Tempo de descanso recomendado em segundos
  toFailure: { type: Boolean, default: false }, // Se deve ir até a falha
  muscleGroups: [String], // Grupos musculares trabalhados
  notes: String,
  completed: { type: Boolean, default: false },
  completedAt: Date,
  skipped: { type: Boolean, default: false }, // Se o exercício foi pulado
  skipReason: String // Razão por ter pulado
});

const WorkoutSessionSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  workoutPlanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'WorkoutPlan', 
    required: true 
  },
  workoutName: { type: String, required: true },
  divisionName: { type: String, required: true },
  divisionIndex: { type: Number }, // Índice da divisão no plano
  exercises: [ExerciseLogSchema],
  status: { 
    type: String, 
    enum: ['in-progress', 'completed', 'cancelled'], 
    default: 'in-progress' 
  },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number, // em minutos
  totalExercises: Number,
  completedExercises: { type: Number, default: 0 },
  skippedExercises: { type: Number, default: 0 },
  totalSets: Number,
  completedSets: { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 }, // Volume total (peso x reps)
  averageRestTime: Number, // Tempo médio de descanso
  studentWeight: { type: Number }, // Peso do aluno na sessão (para exercícios corporais)
  overallDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] }, // Dificuldade geral percebida
  mood: { type: String, enum: ['great', 'good', 'normal', 'tired', 'bad'] }, // Como o aluno se sentiu
  notes: String,
  instructorFeedback: String, // Feedback do instrutor após análise
  currentExerciseIndex: { type: Number, default: 0 }, // Índice do exercício atual
  restStartTime: { type: Date }, // Horário de início do descanso
  isResting: { type: Boolean, default: false }, // Se está em período de descanso
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Calcular métricas antes de salvar
WorkoutSessionSchema.pre('save', function(next) {
  // Calcular duração
  if (this.status === 'completed' && this.endTime && this.startTime) {
    const diff = this.endTime - this.startTime;
    this.duration = Math.round(diff / 60000); // converter para minutos
  }
  
  // Calcular exercícios completados e pulados
  this.completedExercises = this.exercises.filter(ex => ex.completed).length;
  this.skippedExercises = this.exercises.filter(ex => ex.skipped).length;
  
  // Calcular total de sets completados
  this.completedSets = this.exercises.reduce((total, ex) => {
    return total + ex.sets.filter(set => set.completed).length;
  }, 0);
  
  // Calcular volume total (peso x reps)
  this.totalVolume = this.exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((setTotal, set) => {
      if (set.completed) {
        const weight = set.isBodyWeight && this.studentWeight ? this.studentWeight : set.weight;
        const reps = set.actualReps || set.reps;
        return setTotal + (weight * reps);
      }
      return setTotal;
    }, 0);
  }, 0);
  
  // Calcular tempo médio de descanso
  const restTimes = [];
  this.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      if (set.restTimeTaken) restTimes.push(set.restTimeTaken);
    });
  });
  if (restTimes.length > 0) {
    this.averageRestTime = Math.round(restTimes.reduce((a, b) => a + b, 0) / restTimes.length);
  }
  
  next();
});

module.exports = mongoose.model('WorkoutSession', WorkoutSessionSchema);
