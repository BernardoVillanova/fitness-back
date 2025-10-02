const mongoose = require("mongoose");

const InstructorSchema = new mongoose.Schema({
  // Referência ao User
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true
  },
  
  // Dados de contato (duplicados do User para facilitar queries)
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  
  // Dados Profissionais
  cref: { 
    type: String, 
    sparse: true  // Permite múltiplos null, mas valores únicos devem ser únicos
  },
  yearsOfExperience: { 
    type: Number, 
    required: true,
    min: 0
  },
  bio: { 
    type: String, 
    required: true,
    minlength: 50
  },
  
  // Qualificações
  certifications: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Pelo menos uma certificação é obrigatória'
    }
  },
  specialties: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Pelo menos uma especialização é obrigatória'
    }
  },
  
  // Disponibilidade
  availability: {
    workingDays: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          const validDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
          return v && v.length > 0 && v.every(day => validDays.includes(day));
        },
        message: 'Dias de trabalho inválidos'
      }
    },
    startTime: { 
      type: String, 
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: { 
      type: String, 
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  
  // Capacidade de Alunos
  maxStudents: {
    type: Number,
    required: true,
    min: 1,
    default: 20
  },
  
  // Alunos Vinculados
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  }],
  
  // Academia vinculada (se aplicável)
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gym"
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para performance
InstructorSchema.index({ userId: 1 });
InstructorSchema.index({ cref: 1 }, { sparse: true });
InstructorSchema.index({ specialties: 1 });
InstructorSchema.index({ isActive: 1 });

// Método virtual para contar alunos
InstructorSchema.virtual('studentCount').get(function() {
  return this.students ? this.students.length : 0;
});

// Método para verificar se pode adicionar mais alunos
InstructorSchema.methods.canAddStudent = function() {
  return this.students.length < this.maxStudents;
};

module.exports = mongoose.model("Instructor", InstructorSchema);