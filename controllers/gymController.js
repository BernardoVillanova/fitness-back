const Gym = require("../models/gym");
const fs = require("fs");
const path = require("path");

// Função auxiliar para salvar imagem base64
const saveBase64Image = (base64String, gymId = 'temp') => {
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
    const uploadDir = path.join(__dirname, '../uploads/gyms');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Gera nome único para o arquivo
    const fileName = `gym_${gymId}_${Date.now()}.${imageType}`;
    const filePath = path.join(uploadDir, fileName);

    // Salva o arquivo
    fs.writeFileSync(filePath, buffer);

    // Retorna o caminho relativo para salvar no banco
    return `/uploads/gyms/${fileName}`;
  } catch (error) {
    console.error("Erro ao salvar imagem:", error);
    return null;
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

    console.log('Criando nova academia com dados validados:', JSON.stringify(gymData, null, 2));

    // Processar imagem se fornecida
    let imagePath = null;
    if (gymData.imageBase64) {
      console.log('Processando imagem base64...');
      imagePath = saveBase64Image(gymData.imageBase64, 'new');
      if (!imagePath) {
        return res.status(400).json({ message: "Erro ao processar a imagem. Verifique o formato." });
      }
      console.log('Imagem salva em:', imagePath);
    }

    // Criar a nova academia com os dados validados
    const newGym = new Gym({
      name: gymData.name.trim(),
      description: (gymData.description || '').trim(),
      image: imagePath, // Adiciona o caminho da imagem salva
      location: {
        address: gymData.location.address.trim(),
        city: gymData.location.city.trim(),
        state: gymData.location.state.trim().toUpperCase(),
        zipCode: gymData.location.zipCode.trim()
      },
      phone: gymData.phone.trim(),
      email: (gymData.email || '').trim(),
      equipments: gymData.equipments || [], // Inclui equipamentos se fornecidos
      instructors: [], // Inicialmente vazio
      students: [], // Inicialmente vazio
    });

    console.log('Academia a ser salva:', newGym);

    const savedGym = await newGym.save();
    
    // Se salvou com sucesso e tem imagem, atualiza o nome do arquivo com o ID real
    if (imagePath && savedGym._id) {
      const oldPath = path.join(__dirname, '../uploads/gyms', path.basename(imagePath));
      const newFileName = `gym_${savedGym._id}_${Date.now()}.${imagePath.split('.').pop()}`;
      const newPath = path.join(__dirname, '../uploads/gyms', newFileName);
      
      try {
        fs.renameSync(oldPath, newPath);
        savedGym.image = `/uploads/gyms/${newFileName}`;
        await savedGym.save();
      } catch (renameError) {
        console.warn('Erro ao renomear arquivo, mantendo nome original:', renameError);
      }
    }

    res.status(201).json({ message: "Academia criada com sucesso!", gym: savedGym });
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

    // Processar imagem se fornecida como base64
    if (gymData.imageBase64) {
      console.log('Processando nova imagem base64 para atualização...');
      const imagePath = saveBase64Image(gymData.imageBase64, gymId);
      if (!imagePath) {
        return res.status(400).json({ message: "Erro ao processar a imagem. Verifique o formato." });
      }
      updateData.image = imagePath;
      console.log('Nova imagem salva em:', imagePath);
    }
    // Se houver uma nova imagem no upload via FormData
    else if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedGym = await Gym.findByIdAndUpdate(
      gymId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGym) {
      return res.status(404).json({ message: "Academia não encontrada." });
    }

    res.status(200).json(updatedGym);
  } catch (error) {
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
