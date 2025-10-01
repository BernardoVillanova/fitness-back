const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const progressController = require('../controllers/progressController');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Adicionar novo registro de progresso (peso, medidas, força)
router.post('/progress', progressController.addProgressLog);

// Buscar histórico completo de progresso
router.get('/progress/history', progressController.getProgressHistory);

// Buscar evolução de peso
router.get('/progress/weight', progressController.getWeightEvolution);

// Buscar evolução de medidas (circunferências)
router.get('/progress/measurements', progressController.getMeasurementsEvolution);

// Buscar evolução de força
router.get('/progress/strength', progressController.getStrengthEvolution);

// Comparar dois registros de progresso
router.get('/progress/compare', progressController.compareProgress);

// Deletar registro de progresso
router.delete('/progress/:logId', progressController.deleteProgressLog);

module.exports = router;
