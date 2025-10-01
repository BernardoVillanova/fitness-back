const mongoose = require('mongoose');

const ExerciseLogSchema = new mongoose.Schema({
  exerciseId: { type: String, required: true },
  exerciseName: { type: String, required: true },
  sets: [{
    setNumber: { type: Number, required: true },
    reps: { type: Number, required: true },
    weight: { type: Number, default: 0 }, // Peso pode ser preenchido durante o treino
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],
  notes: String,
  completed: { type: Boolean, default: false }
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
  completedExercises: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Calcular duração antes de salvar
WorkoutSessionSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.endTime && this.startTime) {
    const diff = this.endTime - this.startTime;
    this.duration = Math.round(diff / 60000); // converter para minutos
  }
  next();
});

module.exports = mongoose.model('WorkoutSession', WorkoutSessionSchema);
