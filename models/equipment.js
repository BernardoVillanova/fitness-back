const mongoose = require("mongoose");

const EquipmentSchema = new mongoose.Schema({
  // Referência ao Instrutor
  instructorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Instructor", 
    required: true
  },
  
  // Referência à Academia (opcional)
  gymId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Gyms"
  },
  
  // Nome do equipamento (obrigatório)
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Descrição/instruções de uso para o aluno
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Categoria do equipamento
  category: {
    type: String,
    required: true,
    enum: ['cardio', 'musculacao', 'funcional', 'crossfit', 'livre', 'outros'],
    default: 'musculacao'
  },
  
  // Grupos musculares trabalhados (importante para aluno saber)
  muscleGroups: {
    type: [String],
    enum: ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'pernas', 'gluteos', 'abdomen', 'panturrilha', 'antebraco', 'corpo-todo'],
    default: []
  },
  
  // Caminho da imagem do equipamento no servidor
  image: {
    type: String,
    default: null
  },
  
  // Status de disponibilidade
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Dificuldade de uso
  difficulty: {
    type: String,
    enum: ['iniciante', 'intermediario', 'avancado'],
    default: 'intermediario'
  },
  
  // Instruções de segurança
  safetyTips: {
    type: [String],
    default: []
  },
  
  // Contador de uso (para estatísticas)
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'equipments'
});

// Índices para melhorar performance de consultas
EquipmentSchema.index({ instructorId: 1, category: 1 });
EquipmentSchema.index({ gymId: 1 });
EquipmentSchema.index({ muscleGroups: 1 });

module.exports = mongoose.model("Equipment", EquipmentSchema, 'equipments');
