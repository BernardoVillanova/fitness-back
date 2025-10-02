const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  cpf: {
    type: String,
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
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: { 
    type: String, 
    enum: ["aluno", "personal"], 
    required: true
  },
  avatar: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model("User", UserSchema);
