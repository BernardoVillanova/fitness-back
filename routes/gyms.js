const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');

// Rotas básicas CRUD
router.post('/', express.json(), gymController.createGym);
router.put('/:gymId', express.json(), gymController.updateGym);

// Rotas sem upload
router.get('/', gymController.getAllGyms);
router.get('/:gymId', gymController.getGymById);
router.delete('/:gymId', gymController.deleteGym);

// Rotas para gerenciamento de alunos
router.post('/:gymId/students', express.json(), gymController.addStudentToGym);
router.delete('/:gymId/students/:studentId', gymController.removeStudentFromGym);
router.get('/:gymId/students', gymController.getGymStudents);

module.exports = router;