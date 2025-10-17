const mongoose = require("mongoose");

// Sub-schema para medidas corporais
const MeasurementsSchema = new mongoose.Schema({
  shoulder: { type: Number },      // Ombro
  chest: { type: Number },         // Peitoral/Peito
  waist: { type: Number },         // Cintura
  abdomen: { type: Number },       // Abdômen
  hip: { type: Number },           // Quadril
  hips: { type: Number },          // Quadril (alias alternativo)
  arm: { type: Number },           // Braço
  forearm: { type: Number },       // Antebraço
  thigh: { type: Number },         // Coxa
  calf: { type: Number }           // Panturrilha
}, { _id: false, strict: false });

// Registro de evolução física do aluno (peso, medidas, composição corporal)
const ProgressLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  
  // Peso e Composição Corporal
  weight: { type: Number }, // kg
  bodyFatPercentage: { type: Number }, // %
  muscleMass: { type: Number }, // kg
  
  // Circunferências (cm)
  measurements: MeasurementsSchema,
  
  // Força (cargas máximas ou testes)
  strengthTests: {
    benchPress: { type: Number, alias: 'supino' },      // Supino (kg)
    squat: { type: Number, alias: 'agachamento' },      // Agachamento (kg)
    deadlift: { type: Number, alias: 'levantamentoTerra' }, // Levantamento Terra (kg)
    pullUp: { type: Number, alias: 'barraFixa' },       // Barra fixa (reps)
    plank: { type: Number, alias: 'prancha' }           // Prancha (segundos)
  },
  
  // Observações e contexto
  notes: String,
  measuredBy: { type: String, enum: ['instrutor', 'aluno', 'nutricionista'] },
  photoUrls: [String] // URLs de fotos de progresso
});

// WorkoutSummary: Resumo estatístico dos treinos (cache de 30 dias)
// Para histórico completo de treinos executados, usar WorkoutSession collection
const WorkoutSummarySchema = new mongoose.Schema({
  workoutSessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "WorkoutSession" 
  }, // Referência ao treino completo
  workoutPlanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "WorkoutPlan" 
  },
  date: { type: Date, default: Date.now },
  duration: Number, // Duração em minutos
  exercisesCompleted: Number, // Quantidade de exercícios completados
  totalExercises: Number, // Total de exercícios no treino
  status: {
    type: String,
    enum: ["completed", "partial", "missed", "cancelled"],
    default: "missed"
  }
});

const StudentSchema = new mongoose.Schema({
  // ===== DADOS BÁSICOS (Nível Raiz para Consultas Rápidas) =====
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  cpf: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  phone: { 
    type: String,
    required: true
  },
  birthDate: { 
    type: Date,
    required: true
  },
  
  // ===== RELACIONAMENTOS =====
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gym"
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor"
  },
  currentWorkoutPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkoutPlan"
  },
  workoutPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkoutPlan"
  }],
  
  // ===== INFORMAÇÕES PESSOAIS DETALHADAS =====
  personalInfo: {
    // Dados Físicos Atuais
    currentWeight: { type: Number, required: true }, // kg
    currentHeight: { type: Number, required: true }, // cm
    
    // Medidas Corporais Iniciais (opcional - para acompanhamento)
    initialMeasurements: {
      shoulder: Number,         // Ombro (cm)
      chest: Number,            // Peito (cm)
      arm: Number,              // Braço (cm)
      forearm: Number,          // Antebraço (cm)
      waist: Number,            // Cintura (cm)
      hip: Number,              // Quadril (cm)
      thigh: Number,            // Coxa (cm)
      calf: Number,             // Panturrilha (cm)
      bodyFatPercentage: Number // % Gordura Corporal
    },
    
    // Experiência e Perfil
    trainingExperience: {
      type: String,
      enum: ["iniciante", "intermediario", "avancado", "atleta"],
      required: true
    },
    
    // Endereço Completo
    address: {
      cep: { type: String, required: true },
      street: { type: String, required: true },
      number: { type: String, required: true },
      complement: String,
      neighborhood: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      country: { type: String, default: "Brasil" }
    },
    
    // Preferências de Treino
    preferences: {
      trainingDays: [String],  // ["segunda", "quarta", "sexta"]
      preferredTimeStart: String, // "07:00"
      preferredTimeEnd: String,   // "09:00"
      preferredTrainingType: String, // "Musculação", "Funcional", etc.
      trainingGoalType: {
        type: String,
        enum: ["hipertrofia", "emagrecimento", "condicionamento", "forca", "saude", "performance"]
      }
    },
    
    // Disponibilidade Detalhada
    availability: {
      daysPerWeek: { type: Number, min: 1, max: 7 },
      minutesPerSession: Number, // Tempo disponível por sessão
      flexibleSchedule: { type: Boolean, default: false }
    }
  },
  
  // ===== ANAMNESE DE SAÚDE (Completa e Profissional) =====
  healthRestrictions: {
    // Histórico Médico
    hasChronicConditions: { type: Boolean, default: false },
    chronicConditions: [{
      name: String,
      diagnosisDate: Date,
      severity: { type: String, enum: ["leve", "moderada", "grave"] },
      notes: String
    }],
    
    // Medicamentos em Uso
    hasMedications: { type: Boolean, default: false },
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      purpose: String
    }],
    
    // Lesões e Limitações
    hasInjuries: { type: Boolean, default: false },
    injuries: [{
      type: { type: String }, // "joelho", "ombro", "costas", etc.
      description: String,
      date: Date,
      status: { type: String, enum: ["recuperada", "em_tratamento", "cronica"] },
      limitations: String // Exercícios ou movimentos restritos
    }],
    
    // Cirurgias Prévias
    hasSurgeries: { type: Boolean, default: false },
    surgeries: [{
      type: { type: String },  // Tipo da cirurgia (ex: "Joelho", "Ombro")
      date: Date,
      recoveryStatus: String
    }],
    
    // Autorizações e Contatos
    medicalAuthorization: { type: Boolean, default: false },
    authorizationDate: Date,
    doctorContact: {
      name: String,
      specialty: String,
      phone: String,
      email: String
    },
    
    // Outros Fatores de Saúde
    smokingStatus: { 
      type: String, 
      enum: ["nao_fuma", "ex_fumante", "fumante_ocasional", "fumante_regular"] 
    },
    alcoholConsumption: { 
      type: String, 
      enum: ["nao_consome", "ocasional", "moderado", "frequente"] 
    },
    sleepQuality: { 
      type: String, 
      enum: ["excelente", "boa", "regular", "ruim"] 
    },
    stressLevel: { 
      type: String, 
      enum: ["baixo", "moderado", "alto", "muito_alto"] 
    },
    
    // Observações Gerais
    allergies: [String],
    dietaryRestrictions: [String],
    generalNotes: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  // ===== OBJETIVOS E METAS =====
  goals: {
    // Objetivo Principal
    primary: {
      type: { type: String },  // Tipo do objetivo (hipertrofia, emagrecimento, etc)
      description: String,
      targetDate: Date
    },
    
    // Metas de Peso
    weight: {
      initial: Number,
      target: Number,
      monthlyTarget: Number // Meta mensal de treinos
    },
    
    // Metas de Composição Corporal
    bodyComposition: {
      targetBodyFatPercentage: Number,
      targetMuscleMass: Number
    },
    
    // Metas de Performance
    performance: [{
      exerciseName: String,
      currentValue: Number,
      targetValue: Number,
      unit: String, // "kg", "reps", "min", etc.
      achieved: { type: Boolean, default: false },
      achievedDate: Date
    }],
    
    // Metas Pessoais
    personal: [{
      description: String,
      category: { 
        type: String, 
        enum: ["saude", "estetica", "performance", "bem_estar", "outro"] 
      },
      priority: { type: String, enum: ["alta", "media", "baixa"] },
      targetDate: Date,
      achieved: { type: Boolean, default: false },
      achievedDate: Date,
      notes: String
    }],
    
    // Configurações de Metas Mensais
    monthlyWorkouts: { type: Number }, // Meta de treinos por mês
    monthlyCalories: { type: Number }, // Meta de calorias por mês
    monthlyHours: { type: Number } // Meta de horas por mês
  },
  
  // Evolução física (peso, medidas, força)
  progressHistory: [ProgressLogSchema],
  
  // Resumo dos últimos treinos executados (cache)
  workoutSummary: [WorkoutSummarySchema],
  
  status: {
    type: String,
    enum: ["active", "paused", "inactive"],
    default: "active"
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Índices para otimizar consultas
StudentSchema.index({ email: 1 });
StudentSchema.index({ cpf: 1 });
StudentSchema.index({ instructorId: 1 });
StudentSchema.index({ gymId: 1 });
StudentSchema.index({ status: 1 });
StudentSchema.index({ 'personalInfo.address.city': 1 });

// Virtual para calcular idade
StudentSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual para IMC (Índice de Massa Corporal)
StudentSchema.virtual('bmi').get(function() {
  if (!this.personalInfo?.currentWeight || !this.personalInfo?.currentHeight) return null;
  const heightInMeters = this.personalInfo.currentHeight / 100;
  return (this.personalInfo.currentWeight / (heightInMeters * heightInMeters)).toFixed(2);
});

// Método para obter último registro de progresso
StudentSchema.methods.getLatestProgress = function() {
  if (!this.progressHistory || this.progressHistory.length === 0) return null;
  return this.progressHistory.sort((a, b) => b.date - a.date)[0];
};

// Método para adicionar registro de progresso
StudentSchema.methods.addProgressLog = function(progressData) {
  this.progressHistory.push(progressData);
  // Atualizar peso atual se fornecido
  if (progressData.weight) {
    this.personalInfo.currentWeight = progressData.weight;
  }
  return this.save();
};

module.exports = mongoose.model("Student", StudentSchema);