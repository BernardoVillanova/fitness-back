const Gym = require("../models/gym");

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
      equipments: [], // Inicialmente vazio
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

    // Se houver uma nova imagem no upload
    if (req.file) {
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
