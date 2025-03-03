const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  weight: Number, // Peso atual
  height: Number, // Altura
  measurements: {
    chest: Number, // Tórax
    waist: Number, // Cintura
    hips: Number, // Quadril
  },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" }, // Instrutor responsável
  workoutPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkoutPlan" }, // Ficha de treino atribuída
});

module.exports = mongoose.model("Student", StudentSchema);