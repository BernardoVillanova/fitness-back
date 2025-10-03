const mongoose = require("mongoose");

const EquipmentSchema = new mongoose.Schema({
  // Referência ao Instrutor (obrigatório)
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
    required: [true, 'O nome do equipamento é obrigatório'],
    trim: true
  },
  
  // Descrição geral do equipamento (opcional)
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Instruções detalhadas de como usar (obrigatório para alunos)
  howToUse: {
    type: String,
    required: [true, 'As instruções de uso são obrigatórias'],
    trim: true
  },
  
  // Categoria do equipamento
  category: {
    type: String,
    required: true,
    enum: ['cardio', 'musculacao', 'funcional', 'crossfit', 'livre', 'outros'],
    default: 'musculacao'
  },
  
  // Grupos musculares trabalhados (importante para composição de exercícios)
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
  
  // Nível de dificuldade de uso
  difficulty: {
    type: String,
    enum: ['iniciante', 'intermediario', 'avancado'],
    default: 'intermediario'
  },
  
  // Dicas de segurança e cuidados importantes
  safetyTips: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Status de disponibilidade
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Contador de uso em exercícios (para estatísticas)
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
