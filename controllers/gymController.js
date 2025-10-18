const Gym = require("../models/gym");
const fs = require("fs");
const path = require("path");

// Função para salvar imagem base64
const saveBase64Image = (base64Data, gymName) => {
  try {
    // Remove o prefixo data:image/...;base64,
    const base64Image = base64Data.split(';base64,').pop();
    
    // Gera nome único para o arquivo
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const sanitizedName = gymName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `gym_${sanitizedName}_${timestamp}_${randomSuffix}.jpg`;
    
    // Caminho completo para salvar a imagem
    const uploadsDir = path.join(__dirname, '../uploads/gyms');
    const filePath = path.join(uploadsDir, filename);
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Salvar a imagem
    fs.writeFileSync(filePath, base64Image, 'base64');
    
    console.log(`Imagem salva: ${filename}`);
    return `/uploads/gyms/${filename}`;
  } catch (error) {
    console.error('Erro ao salvar imagem base64:', error);
    throw new Error('Falha ao salvar imagem');
  }
};

// Criar academia
exports.createGym = async (req, res) => {
  try {
    console.log('=== Início do createGym ===');
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    
    // Tenta extrair os dados do formato esperado
    const gymData = req.body;
    
    // Validações de campos obrigatórios
    const requiredFields = ['name', 'phone'];
    const requiredLocationFields = ['address', 'city', 'state', 'zipCode'];
    
    // Valida campos principais
    const missingFields = requiredFields.filter(field => !gymData[field]);
    
    // Valida campos de localização
    const missingLocationFields = !gymData.location ? requiredLocationFields :
      requiredLocationFields.filter(field => !gymData.location[field]);
    
    if (missingFields.length > 0 || missingLocationFields.length > 0) {
      return res.status(400).json({
        message: "Campos obrigatórios faltando",
        missingFields: [...missingFields, ...missingLocationFields.map(f => `location.${f}`)],
        received: gymData
      });
    }

    console.log('Criando nova academia com dados validados:', JSON.stringify({
      ...gymData,
      imageBase64: gymData.imageBase64 ? '[BASE64_DATA]' : undefined
    }, null, 2));

    // Processa equipamentos se fornecidos
    let processedEquipments = [];
    if (gymData.equipments && Array.isArray(gymData.equipments)) {
      processedEquipments = gymData.equipments.map(eq => ({
        sourceId: eq.sourceId || eq._id || null,
        name: eq.name || '',
        description: eq.description || '',
        quantity: Math.max(1, parseInt(eq.quantity) || 1),
        category: eq.category || 'Geral',
        muscleGroups: eq.muscleGroups || [],
        image: eq.image || null,
        isCustom: eq.isCustom || false,
        condition: 'good', // Padrão
        notes: eq.notes || ''
      }));
    }

    // Processa imagem se fornecida
    let imagePath = null;
    if (gymData.imageBase64) {
      try {
        imagePath = saveBase64Image(gymData.imageBase64, gymData.name);
        console.log('Imagem processada e salva:', imagePath);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        // Não falha a criação da academia por causa da imagem
      }
    }

    // Criar a nova academia com os dados validados
    const newGym = new Gym({
      name: gymData.name.trim(),
      description: (gymData.description || '').trim(),
      location: {
        address: gymData.location.address.trim(),
        city: gymData.location.city.trim(),
        state: gymData.location.state.trim().toUpperCase(),
        zipCode: gymData.location.zipCode.trim()
      },
      phone: gymData.phone.trim(),
      email: (gymData.email || '').trim(),
      image: imagePath, // Adiciona o caminho da imagem se houver
      equipments: processedEquipments, // Adiciona os equipamentos processados
      instructors: [], // Inicialmente vazio
      students: [], // Inicialmente vazio
    });

    console.log('Academia a ser salva:', newGym);

    await newGym.save();
    res.status(201).json({ message: "Academia criada com sucesso!", gym: newGym });
  } catch (error) {
    console.error('Erro detalhado:', error);
    res.status(500).json({ 
      message: "Erro ao criar academia.", 
      error: error.message,
      stack: error.stack 
    });
  }
};

// Listar todas as academias
exports.getAllGyms = async (req, res) => {
  try {
    const gyms = await Gym.find();
    res.status(200).json(gyms);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar academias.", error: error.message });
  }
};

// Buscar academia por ID
exports.getGymById = async (req, res) => {
  try {
    const { gymId } = req.params;
    const gym = await Gym.findById(gymId);

    if (!gym) {
      return res.status(404).json({ message: "Academia não encontrada." });
    }

    res.status(200).json(gym);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar academia.", error: error.message });
  }
};

// Atualizar academia
exports.updateGym = async (req, res) => {
  try {
    const { gymId } = req.params;
    let gymData = req.body;
    
    console.log('Atualizando academia:', gymId);
    console.log('Dados recebidos:', JSON.stringify({
      ...gymData,
      imageBase64: gymData.imageBase64 ? '[BASE64_DATA]' : undefined
    }, null, 2));

    // Se os dados vierem como FormData, location estará como string
    if (typeof gymData.location === 'string') {
      gymData.location = JSON.parse(gymData.location);
    }

    // Preparar dados para atualização
    const updateData = {
      name: gymData.name,
      description: gymData.description,
      location: {
        address: gymData.location.address,
        city: gymData.location.city,
        state: gymData.location.state,
        zipCode: gymData.location.zipCode
      },
      phone: gymData.phone,
      email: gymData.email
    };

    // Processa equipamentos se fornecidos
    if (gymData.equipments && Array.isArray(gymData.equipments)) {
      updateData.equipments = gymData.equipments.map(eq => ({
        sourceId: eq.sourceId || eq._id || null,
        name: eq.name || '',
        description: eq.description || '',
        quantity: Math.max(1, parseInt(eq.quantity) || 1),
        category: eq.category || 'Geral',
        muscleGroups: eq.muscleGroups || [],
        image: eq.image || null,
        isCustom: eq.isCustom || false,
        condition: 'good',
        notes: eq.notes || ''
      }));
    }

    // Processa nova imagem se fornecida (base64)
    if (gymData.imageBase64) {
      try {
        const imagePath = saveBase64Image(gymData.imageBase64, gymData.name);
        updateData.image = imagePath;
        console.log('Nova imagem processada:', imagePath);
      } catch (error) {
        console.error('Erro ao processar nova imagem:', error);
        // Não falha a atualização por causa da imagem
      }
    }

    // Se houver uma nova imagem no upload tradicional
    if (req.file) {
      updateData.image = `/uploads/gyms/${req.file.filename}`;
      console.log('Imagem de upload tradicional:', updateData.image);
    }

    const updatedGym = await Gym.findByIdAndUpdate(
      gymId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGym) {
      return res.status(404).json({ message: "Academia não encontrada." });
    }

    console.log('Academia atualizada com sucesso:', updatedGym._id);
    res.status(200).json(updatedGym);
  } catch (error) {
    console.error('Erro ao atualizar academia:', error);
    res.status(500).json({ message: "Erro ao atualizar academia.", error: error.message });
  }
};

// Deletar academia
exports.deleteGym = async (req, res) => {
  try {
    const { gymId } = req.params;

    const deletedGym = await Gym.findByIdAndDelete(gymId);
    if (!deletedGym) {
      return res.status(404).json({ message: "Academia não encontrada." });
    }

    res.status(200).json({ message: "Academia removida com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao remover academia.", error: error.message });
  }
};

// Vincular aluno à academia
exports.addStudentToGym = async (req, res) => {
  try {
    const { gymId } = req.params;
    const { studentId, instructorId } = req.body;

    // Validações
    if (!studentId) {
      return res.status(400).json({ message: "ID do aluno é obrigatório." });
    }

    // Buscar academia
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ message: "Academia não encontrada." });
    }

    // Verificar se o aluno já está vinculado
    if (gym.students.includes(studentId)) {
      return res.status(400).json({ message: "Aluno já está vinculado a esta academia." });
    }

    // Adicionar aluno à academia
    gym.students.push(studentId);

    // Se um instructor foi fornecido, adicionar à academia se não estiver lá
    if (instructorId) {
      if (!gym.instructors.includes(instructorId)) {
        gym.instructors.push(instructorId);
        console.log(`Instrutor ${instructorId} adicionado à academia ${gymId}`);
      }
    }

    await gym.save();

    // Atualizar o aluno com o instrutor
    if (instructorId) {
      const Student = require("../models/student");
      await Student.findByIdAndUpdate(studentId, { instructorId: instructorId });
    }

    // Retornar academia atualizada com dados populados
    const updatedGym = await Gym.findById(gymId)
      .populate('students', 'name email phone personalInfo instructorId')
      .populate('instructors', 'name personalInfo')
      .populate({
        path: 'students',
        populate: {
          path: 'instructorId',
          select: 'name personalInfo'
        }
      });

    res.status(200).json({
      message: "Aluno vinculado com sucesso!",
      gym: updatedGym
    });
  } catch (error) {
    console.error('Erro ao vincular aluno:', error);
    res.status(500).json({ message: "Erro ao vincular aluno.", error: error.message });
  }
};

// Desvincular aluno da academia
exports.removeStudentFromGym = async (req, res) => {
  try {
    const { gymId, studentId } = req.params;

    // Buscar academia
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ message: "Academia não encontrada." });
    }

    // Verificar se o aluno está vinculado
    if (!gym.students.includes(studentId)) {
      return res.status(400).json({ message: "Aluno não está vinculado a esta academia." });
    }

    // Remover aluno da academia
    gym.students = gym.students.filter(id => id.toString() !== studentId);
    await gym.save();

    // Também remover o instrutor do aluno (opcional)
    const Student = require("../models/student");
    await Student.findByIdAndUpdate(studentId, { $unset: { instructorId: 1 } });

    // Retornar academia atualizada com dados populados
    const updatedGym = await Gym.findById(gymId)
      .populate('students', 'name email phone personalInfo instructorId')
      .populate('instructors', 'name personalInfo')
      .populate({
        path: 'students',
        populate: {
          path: 'instructorId',
          select: 'name personalInfo'
        }
      });

    res.status(200).json({
      message: "Aluno desvinculado com sucesso!",
      gym: updatedGym
    });
  } catch (error) {
    console.error('Erro ao desvincular aluno:', error);
    res.status(500).json({ message: "Erro ao desvincular aluno.", error: error.message });
  }
};

// Listar alunos da academia
exports.getGymStudents = async (req, res) => {
  try {
    const { gymId } = req.params;

    const gym = await Gym.findById(gymId)
      .populate('students', 'name email phone personalInfo instructorId')
      .populate('instructors', 'name personalInfo')
      .populate({
        path: 'students',
        populate: {
          path: 'instructorId',
          select: 'name personalInfo'
        }
      });

    if (!gym) {
      return res.status(404).json({ message: "Academia não encontrada." });
    }

    res.status(200).json({
      students: gym.students,
      total: gym.students.length
    });
  } catch (error) {
    console.error('Erro ao buscar alunos da academia:', error);
    res.status(500).json({ message: "Erro ao buscar alunos.", error: error.message });
  }
};
