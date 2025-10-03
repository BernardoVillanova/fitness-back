const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema({
  // Referência ao Instrutor (obrigatório)
  instructorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Instructor", 
    required: true
  },
  
  // Nome do exercício (obrigatório)
  name: {
    type: String,
    required: [true, 'O nome do exercício é obrigatório'],
    trim: true
  },
  
  // Descrição geral do exercício (opcional)
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Como executar o exercício (obrigatório)
  howToPerform: {
    type: String,
    required: [true, 'As instruções de execução são obrigatórias'],
    trim: true
  },
  
  // Categoria do exercício
  category: {
    type: String,
    required: true,
    enum: ['forca', 'cardio', 'flexibilidade', 'resistencia', 'potencia', 'outros'],
    default: 'forca'
  },
  
  // Grupos musculares trabalhados
  muscleGroups: {
    type: [String],
    enum: ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'pernas', 'gluteos', 'abdomen', 'panturrilha', 'antebraco', 'corpo-todo'],
    default: []
  },
  
  // Referência ao equipamento (opcional)
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment",
    default: null
  },
  
  // Caminho da imagem do exercício
  image: {
    type: String,
    default: null
  },
  
  // Nível de dificuldade
  difficulty: {
    type: String,
    enum: ['iniciante', 'intermediario', 'avancado'],
    default: 'intermediario'
  },
  
  // Dicas de segurança
  safetyTips: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Variações do exercício
  variations: {
    type: [String],
    default: []
  },
  
  // Vídeo URL (opcional)
  videoUrl: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Status de ativo
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Contador de uso em planos (para estatísticas)
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'exercises'
});

// Índices para melhorar performance
ExerciseSchema.index({ instructorId: 1, category: 1 });
ExerciseSchema.index({ muscleGroups: 1 });
ExerciseSchema.index({ equipmentId: 1 });
ExerciseSchema.index({ difficulty: 1 });

module.exports = mongoose.model("Exercise", ExerciseSchema, 'exercises');
