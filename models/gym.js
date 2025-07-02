const mongoose = require("mongoose");

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Ex: "Leg Press"
  quantity: { type: Number, default: 1 },       // Quantidade disponível
  condition: { 
    type: String, 
    enum: ["excellent", "good", "needs repair"], 
    default: "good" 
  },
  image: String,                                // (opcional) imagem do equipamento
  notes: String                                  // (opcional) observações
});

const GymSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  equipments: [EquipmentSchema],
  instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Instructor" }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]
});

module.exports = mongoose.model("Gym", GymSchema);
