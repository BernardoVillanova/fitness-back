const mongoose = require("mongoose");

const InstructorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // certifications: [String], // Certificações do instrutor
  specialties: [String], // Especializações
});

module.exports = mongoose.model("Instructor", InstructorSchema);