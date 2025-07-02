const Gym = require("../models/gym");

// Criar academia
exports.createGym = async (req, res) => {
  try {
    const { name, address, equipment } = req.body;

    const newGym = new Gym({
      name,
      address,
      equipment, // lista de equipamentos
    });

    await newGym.save();
    res.status(201).json({ message: "Academia criada com sucesso!", gym: newGym });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar academia.", error: error.message });
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
    const { name, address, equipment } = req.body;

    const updatedGym = await Gym.findByIdAndUpdate(
      gymId,
      { name, address, equipment },
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
