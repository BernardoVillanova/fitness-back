const Student = require('../models/student');

// Adicionar novo registro de progresso físico
exports.addProgressLog = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const {
      weight,
      bodyFatPercentage,
      muscleMass,
      measurements,
      strengthTests,
      notes,
      measuredBy,
      photoUrls
    } = req.body;
    
    const progressLog = {
      date: new Date(),
      weight,
      bodyFatPercentage,
      muscleMass,
      measurements,
      strengthTests,
      notes,
      measuredBy: measuredBy || 'aluno',
      photoUrls: photoUrls || []
    };
    
    await Student.findByIdAndUpdate(
      student._id,
      {
        $push: {
          progressHistory: {
            $each: [progressLog],
            $position: 0  // Adiciona no início
          }
        }
      },
      { new: true }
    );
    
    res.json({ 
      message: 'Progresso registrado com sucesso!',
      progress: progressLog
    });
  } catch (error) {
    console.error('Erro ao adicionar progresso:', error);
    res.status(500).json({ message: 'Erro ao registrar progresso' });
  }
};

// Buscar histórico de progresso
exports.getProgressHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, startDate, endDate } = req.query;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId })
      .select('progressHistory');
    
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    let history = student.progressHistory;
    
    // Filtrar por data se fornecido
    if (startDate || endDate) {
      history = history.filter(log => {
        const logDate = new Date(log.date);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    // Limitar resultados
    history = history.slice(0, parseInt(limit));
    
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico de progresso' });
  }
};

// Buscar evolução de peso
exports.getWeightEvolution = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 6 } = req.query;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId })
      .select('progressHistory');
    
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(months));
    
    const weightHistory = student.progressHistory
      .filter(log => log.weight && new Date(log.date) >= cutoffDate)
      .map(log => ({
        date: log.date,
        weight: log.weight,
        bodyFatPercentage: log.bodyFatPercentage,
        muscleMass: log.muscleMass
      }))
      .reverse(); // Mais antigo primeiro
    
    // Calcular estatísticas
    const weights = weightHistory.map(h => h.weight);
    const stats = {
      current: weights[weights.length - 1],
      initial: weights[0],
      difference: weights[weights.length - 1] - weights[0],
      percentageChange: ((weights[weights.length - 1] - weights[0]) / weights[0] * 100).toFixed(1),
      highest: Math.max(...weights),
      lowest: Math.min(...weights)
    };
    
    res.json({
      history: weightHistory,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar evolução de peso:', error);
    res.status(500).json({ message: 'Erro ao buscar evolução de peso' });
  }
};

// Buscar evolução de medidas (circunferências)
exports.getMeasurementsEvolution = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 6 } = req.query;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId })
      .select('progressHistory');
    
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(months));
    
    const measurementsHistory = student.progressHistory
      .filter(log => log.measurements && new Date(log.date) >= cutoffDate)
      .map(log => ({
        date: log.date,
        measurements: log.measurements
      }))
      .reverse();
    
    res.json(measurementsHistory);
  } catch (error) {
    console.error('Erro ao buscar evolução de medidas:', error);
    res.status(500).json({ message: 'Erro ao buscar evolução de medidas' });
  }
};

// Buscar evolução de força
exports.getStrengthEvolution = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 6 } = req.query;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId })
      .select('progressHistory');
    
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(months));
    
    const strengthHistory = student.progressHistory
      .filter(log => log.strengthTests && new Date(log.date) >= cutoffDate)
      .map(log => ({
        date: log.date,
        strengthTests: log.strengthTests
      }))
      .reverse();
    
    // Calcular ganhos percentuais
    const calculateGains = (exercise) => {
      const values = strengthHistory
        .map(h => h.strengthTests?.[exercise])
        .filter(v => v !== undefined && v !== null);
      
      if (values.length < 2) return null;
      
      return {
        initial: values[0],
        current: values[values.length - 1],
        gain: values[values.length - 1] - values[0],
        percentageGain: ((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(1)
      };
    };
    
    const gains = {
      benchPress: calculateGains('benchPress'),
      squat: calculateGains('squat'),
      deadlift: calculateGains('deadlift'),
      pullUp: calculateGains('pullUp'),
      plank: calculateGains('plank')
    };
    
    res.json({
      history: strengthHistory,
      gains
    });
  } catch (error) {
    console.error('Erro ao buscar evolução de força:', error);
    res.status(500).json({ message: 'Erro ao buscar evolução de força' });
  }
};

// Comparar dois registros de progresso
exports.compareProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { logId1, logId2 } = req.query;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId })
      .select('progressHistory');
    
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const log1 = student.progressHistory.id(logId1);
    const log2 = student.progressHistory.id(logId2);
    
    if (!log1 || !log2) {
      return res.status(404).json({ message: 'Registros não encontrados' });
    }
    
    // Calcular diferenças
    const comparison = {
      date1: log1.date,
      date2: log2.date,
      weight: {
        before: log1.weight,
        after: log2.weight,
        difference: log2.weight - log1.weight
      },
      bodyFat: {
        before: log1.bodyFatPercentage,
        after: log2.bodyFatPercentage,
        difference: log2.bodyFatPercentage - log1.bodyFatPercentage
      },
      measurements: {},
      strength: {}
    };
    
    // Comparar medidas
    if (log1.measurements && log2.measurements) {
      Object.keys(log1.measurements.toObject()).forEach(key => {
        if (log1.measurements[key] && log2.measurements[key]) {
          comparison.measurements[key] = {
            before: log1.measurements[key],
            after: log2.measurements[key],
            difference: log2.measurements[key] - log1.measurements[key]
          };
        }
      });
    }
    
    // Comparar força
    if (log1.strengthTests && log2.strengthTests) {
      Object.keys(log1.strengthTests.toObject()).forEach(key => {
        if (log1.strengthTests[key] && log2.strengthTests[key]) {
          comparison.strength[key] = {
            before: log1.strengthTests[key],
            after: log2.strengthTests[key],
            difference: log2.strengthTests[key] - log1.strengthTests[key],
            percentageGain: ((log2.strengthTests[key] - log1.strengthTests[key]) / log1.strengthTests[key] * 100).toFixed(1)
          };
        }
      });
    }
    
    res.json(comparison);
  } catch (error) {
    console.error('Erro ao comparar progresso:', error);
    res.status(500).json({ message: 'Erro ao comparar progresso' });
  }
};

// Deletar registro de progresso
exports.deleteProgressLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { logId } = req.params;
    
    // Buscar aluno pelo userId
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    await Student.findByIdAndUpdate(
      student._id,
      {
        $pull: {
          progressHistory: { _id: logId }
        }
      }
    );
    
    res.json({ message: 'Registro deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar progresso:', error);
    res.status(500).json({ message: 'Erro ao deletar registro' });
  }
};

module.exports = exports;
