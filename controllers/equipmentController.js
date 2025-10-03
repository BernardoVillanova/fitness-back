const Equipment = require("../models/equipment");
const fs = require("fs");
const path = require("path");

// Função auxiliar para salvar imagem base64
const saveBase64Image = (base64String, instructorId) => {
  try {
    // Remove o prefixo data:image/...;base64,
    const matches = base64String.match(/^data:image\/([a-zA-Z]*);base64,([^\"]*)/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const imageType = matches[1]; // png, jpg, jpeg, etc
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    // Cria diretório se não existir
    const uploadDir = path.join(__dirname, '../uploads/equipments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Gera nome único para o arquivo
    const fileName = `equipment_${instructorId}_${Date.now()}.${imageType}`;
    const filePath = path.join(uploadDir, fileName);

    // Salva o arquivo
    fs.writeFileSync(filePath, buffer);

    // Retorna o caminho relativo para salvar no banco
    return `/uploads/equipments/${fileName}`;
  } catch (error) {
    console.error("Erro ao salvar imagem:", error);
    return null;
  }
};

// Criar novo equipamento
exports.createEquipment = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { name, description, category, muscleGroups, difficulty, safetyTips, imageBase64 } = req.body;

    // Validações básicas
    if (!name) {
      return res.status(400).json({ message: "Nome do equipamento é obrigatório" });
    }

    if (!description) {
      return res.status(400).json({ message: "Descrição é obrigatória" });
    }

    if (!category) {
      return res.status(400).json({ message: "Categoria é obrigatória" });
    }

    // Processa a imagem se fornecida
    let imagePath = null;
    if (imageBase64) {
      imagePath = saveBase64Image(imageBase64, instructorId);
    }

    const equipmentData = {
      instructorId,
      name,
      description,
      category,
      muscleGroups: muscleGroups || [],
      difficulty: difficulty || 'intermediario',
      safetyTips: safetyTips || [],
      image: imagePath
    };

    const equipment = new Equipment(equipmentData);
    await equipment.save();

    res.status(201).json({
      message: "Equipamento cadastrado com sucesso!",
      equipment
    });
  } catch (error) {
    console.error("Erro ao criar equipamento:", error);
    
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Dados inválidos", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({ message: "Erro ao cadastrar equipamento" });
  }
};

// Listar todos os equipamentos de um instrutor
exports.getEquipmentsByInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { category, condition, isAvailable } = req.query;

    // Construir filtro de busca
    const filter = { instructorId };
    
    if (category) {
      filter.category = category;
    }
    
    if (condition) {
      filter.condition = condition;
    }
    
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    const equipments = await Equipment.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: equipments.length,
      equipments
    });
  } catch (error) {
    console.error("Erro ao buscar equipamentos:", error);
    res.status(500).json({ message: "Erro ao buscar equipamentos" });
  }
};

// Buscar equipamento por ID
exports.getEquipmentById = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const equipment = await Equipment.findById(equipmentId)
      .populate('instructorId', 'name email')
      .populate('gymId', 'name location');

    if (!equipment) {
      return res.status(404).json({ message: "Equipamento não encontrado" });
    }

    res.status(200).json({ equipment });
  } catch (error) {
    console.error("Erro ao buscar equipamento:", error);
    res.status(500).json({ message: "Erro ao buscar equipamento" });
  }
};

// Atualizar equipamento
exports.updateEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const updateData = req.body;

    // Não permitir alteração do instructorId
    delete updateData.instructorId;

    const equipment = await Equipment.findByIdAndUpdate(
      equipmentId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({ message: "Equipamento não encontrado" });
    }

    res.status(200).json({
      message: "Equipamento atualizado com sucesso!",
      equipment
    });
  } catch (error) {
    console.error("Erro ao atualizar equipamento:", error);
    
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Dados inválidos", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({ message: "Erro ao atualizar equipamento" });
  }
};

// Deletar equipamento
exports.deleteEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const equipment = await Equipment.findByIdAndDelete(equipmentId);

    if (!equipment) {
      return res.status(404).json({ message: "Equipamento não encontrado" });
    }

    // Remove a imagem do servidor se existir
    if (equipment.image) {
      const imagePath = path.join(__dirname, '..', equipment.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({
      message: "Equipamento removido com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao deletar equipamento:", error);
    res.status(500).json({ message: "Erro ao deletar equipamento" });
  }
};

// Adicionar manutenção ao equipamento
exports.addMaintenance = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { description, performedBy, cost } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Descrição da manutenção é obrigatória" });
    }

    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ message: "Equipamento não encontrado" });
    }

    equipment.maintenanceHistory.push({
      date: new Date(),
      description,
      performedBy,
      cost: cost || 0
    });

    // Se em manutenção, marcar como indisponível
    if (equipment.condition === 'manutencao') {
      equipment.isAvailable = false;
    }

    await equipment.save();

    res.status(200).json({
      message: "Manutenção registrada com sucesso!",
      equipment
    });
  } catch (error) {
    console.error("Erro ao adicionar manutenção:", error);
    res.status(500).json({ message: "Erro ao registrar manutenção" });
  }
};

// Obter estatísticas dos equipamentos do instrutor
exports.getEquipmentStats = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const stats = await Equipment.aggregate([
      { $match: { instructorId: require('mongoose').Types.ObjectId(instructorId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: {
            $push: {
              category: "$category",
              condition: "$condition"
            }
          },
          available: {
            $sum: { $cond: [{ $eq: ["$isAvailable", true] }, 1, 0] }
          },
          inMaintenance: {
            $sum: { $cond: [{ $eq: ["$condition", "manutencao"] }, 1, 0] }
          }
        }
      }
    ]);

    // Contar por categoria
    const categoryCount = await Equipment.aggregate([
      { $match: { instructorId: require('mongoose').Types.ObjectId(instructorId) } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    // Contar por condição
    const conditionCount = await Equipment.aggregate([
      { $match: { instructorId: require('mongoose').Types.ObjectId(instructorId) } },
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      stats: stats[0] || { total: 0, available: 0, inMaintenance: 0 },
      byCategory: categoryCount,
      byCondition: conditionCount
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
};
