const mongoose = require("mongoose");

const EquipmentSchema = new mongoose.Schema({
  sourceId: { type: String },                   // ID do equipamento original
  name: { type: String, required: true },       // Ex: "Leg Press"
  description: { type: String },                // Descrição do equipamento
  quantity: { type: Number, default: 1 },       // Quantidade disponível
  category: { type: String, default: 'Geral' }, // Categoria (musculacao, cardio, etc)
  muscleGroups: [{ type: String }],             // Grupos musculares
  image: { type: String },                      // Imagem do equipamento
  isCustom: { type: Boolean, default: false },  // Se é equipamento customizado
  condition: { 
    type: String, 
    enum: ["excellent", "good", "needs repair"], 
    default: "good" 
  },
  notes: { type: String }                       // Observações
});

const GymSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String }, // Caminho da imagem no servidor
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  phone: { type: String, required: true },
  email: { type: String },
  equipments: [EquipmentSchema],
  instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Instructor" }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
  collection: 'gyms' // Força o nome da coleção para 'gyms'
});

module.exports = mongoose.model("Gyms", GymSchema, 'gyms');
