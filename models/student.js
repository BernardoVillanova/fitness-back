const mongoose = require("mongoose");

const ProgressLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  weight: Number,
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    thighs: Number,
    arms: Number
  },
  bodyFatPercentage: Number,
  notes: String
});

const WorkoutHistorySchema = new mongoose.Schema({
  workoutPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkoutPlan" },
  date: { type: Date, default: Date.now },
  exercisesCompleted: [
    {
      exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise" },
      sets: Number,
      reps: [Number],
      weightUsed: Number,
      notes: String
    }
  ],
  status: {
    type: String,
    enum: ["completed", "partial", "missed"],
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
      targetValue: Number
    }
  ],
  progressHistory: [ProgressLogSchema],
  workoutHistory: [WorkoutHistorySchema],
  status: {
    type: String,
    enum: ["active", "paused", "inactive"],
    default: "active"
  }
});

module.exports = mongoose.model("Student", StudentSchema);