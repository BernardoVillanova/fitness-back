const Exercise = require("../models/exercise");
const Equipment = require("../models/equipment");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Função auxiliar para salvar imagem base64
const saveBase64Image = (base64String, instructorId) => {
  try {
    const matches = base64String.match(/^data:image\/([a-zA-Z]*);base64,([^\"]*)/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const imageType = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    const uploadDir = path.join(__dirname, '../uploads/exercises');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `exercise_${instructorId}_${Date.now()}.${imageType}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return `/uploads/exercises/${fileName}`;
  } catch (error) {
    console.error("Erro ao salvar imagem:", error);
    return null;
  }
};

// Criar novo exercício
exports.createExercise = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { 
      name, 
      description, 
      howToPerform,
      sets,
      reps,
      restTime,
      duration,
      category, 
      muscleGroups, 
      equipmentId,
      difficulty, 
      safetyTips,
      variations,
      videoUrl,
      imageBase64,
      gymId
    } = req.body;

    console.log('🟢 [createExercise] Dados recebidos:', { name, category, difficulty, muscleGroups, equipmentId });

    // Validações básicas
    if (!name) {
      return res.status(400).json({ message: "Nome do exercício é obrigatório" });
    }

    if (!howToPerform) {
      return res.status(400).json({ message: "Instruções de execução são obrigatórias" });
    }

    if (!category) {
      return res.status(400).json({ message: "Categoria é obrigatória" });
    }

    // Processa a imagem se fornecida
    let imagePath = null;
    if (imageBase64) {
      imagePath = saveBase64Image(imageBase64, instructorId);
      if (!imagePath) {
        return res.status(400).json({ message: "Erro ao processar a imagem" });
      }
    }

    const exerciseData = {
      instructorId,
      name,
      description: description || '',
      howToPerform,
      category,
      muscleGroups: Array.isArray(muscleGroups) ? muscleGroups : [],
      equipmentId: equipmentId || null,
      difficulty: difficulty || 'intermediario',
      safetyTips: safetyTips || '',
      variations: Array.isArray(variations) ? variations : [],
      videoUrl: videoUrl || '',
      image: imagePath,
      isActive: true,
      usageCount: 0
    };

    const exercise = new Exercise(exerciseData);
    await exercise.save();

    // Popular o equipamento se houver
    await exercise.populate('equipmentId', 'name category');

    res.status(201).json({
      success: true,
      message: "Exercício cadastrado com sucesso!",
      exercise
    });
  } catch (error) {
    console.error("❌ [createExercise] Erro:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false,
        message: "Dados inválidos", 
        errors
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Erro ao cadastrar exercício" 
    });
  }
};

// Listar todos os exercícios de um instrutor
exports.getExercisesByInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { category, difficulty, muscleGroup, equipmentId } = req.query;

    const filter = { instructorId, isActive: true };
    
    if (category && category !== 'todos') {
      filter.category = category;
    }
    
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (muscleGroup) {
      filter.muscleGroups = muscleGroup;
    }

    if (equipmentId) {
      filter.equipmentId = equipmentId;
    }

    const exercises = await Exercise.find(filter)
      .populate('equipmentId', 'name category image')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: exercises.length,
      exercises
    });
  } catch (error) {
    console.error("Erro ao buscar exercícios:", error);
    res.status(500).json({ message: "Erro ao buscar exercícios" });
  }
};

// Buscar exercício por ID
exports.getExerciseById = async (req, res) => {
  try {
    const { exerciseId } = req.params;

    const exercise = await Exercise.findById(exerciseId)
      .populate('equipmentId', 'name category image description')
      .lean();

    if (!exercise) {
      return res.status(404).json({ message: "Exercício não encontrado" });
    }

    res.status(200).json({
      success: true,
      exercise
    });
  } catch (error) {
    console.error("Erro ao buscar exercício:", error);
    res.status(500).json({ message: "Erro ao buscar exercício" });
  }
};

// Atualizar exercício
exports.updateExercise = async (req, res) => {
  try {
    const { exerciseId } = req.params;
    console.log('🔵 [updateExercise] Atualizando exercício:', exerciseId);
    console.log('🔵 [updateExercise] Dados:', req.body);
    
    const currentExercise = await Exercise.findById(exerciseId);
    if (!currentExercise) {
      return res.status(404).json({ message: "Exercício não encontrado" });
    }

    const updateData = { ...req.body };
    delete updateData.instructorId;

    // Processar muscleGroups se vier como string JSON
    if (typeof updateData.muscleGroups === 'string') {
      try {
        updateData.muscleGroups = JSON.parse(updateData.muscleGroups);
      } catch (e) {
        updateData.muscleGroups = [];
      }
    }

    // Processar variations se vier como string JSON
    if (typeof updateData.variations === 'string') {
      try {
        updateData.variations = JSON.parse(updateData.variations);
      } catch (e) {
        updateData.variations = [];
      }
    }

    // Processar nova imagem se fornecida
    if (updateData.imageBase64) {
      console.log('🟢 [updateExercise] Processando nova imagem');
      
      if (currentExercise.image) {
        const oldImagePath = path.join(__dirname, '..', currentExercise.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('🗑️ [updateExercise] Imagem antiga removida');
        }
      }

      const newImagePath = saveBase64Image(updateData.imageBase64, currentExercise.instructorId);
      if (newImagePath) {
        updateData.image = newImagePath;
        console.log('✅ [updateExercise] Nova imagem salva');
      }
      
      delete updateData.imageBase64;
    }

    const exercise = await Exercise.findByIdAndUpdate(
      exerciseId,
      updateData,
      { new: true, runValidators: true }
    ).populate('equipmentId', 'name category image');

    console.log('✅ [updateExercise] Exercício atualizado');

    res.status(200).json({
      success: true,
      message: "Exercício atualizado com sucesso!",
      exercise
    });
  } catch (error) {
    console.error("❌ [updateExercise] Erro:", error);
    
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        success: false,
        message: "Dados inválidos", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Erro ao atualizar exercício",
      error: error.message 
    });
  }
};

// Deletar exercício
exports.deleteExercise = async (req, res) => {
  try {
    const { exerciseId } = req.params;

    const exercise = await Exercise.findByIdAndDelete(exerciseId);

    if (!exercise) {
      return res.status(404).json({ message: "Exercício não encontrado" });
    }

    // Remove a imagem do servidor se existir
    if (exercise.image) {
      const imagePath = path.join(__dirname, '..', exercise.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({
      success: true,
      message: "Exercício removido com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao deletar exercício:", error);
    res.status(500).json({ message: "Erro ao deletar exercício" });
  }
};

// Estatísticas dos exercícios
exports.getExerciseStats = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const total = await Exercise.countDocuments({ instructorId, isActive: true });
    
    const byCategory = await Exercise.aggregate([
      { $match: { instructorId: mongoose.Types.ObjectId(instructorId), isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const byDifficulty = await Exercise.aggregate([
      { $match: { instructorId: mongoose.Types.ObjectId(instructorId), isActive: true } },
      { $group: { _id: "$difficulty", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        byCategory,
        byDifficulty
      }
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
};

module.exports = exports;
