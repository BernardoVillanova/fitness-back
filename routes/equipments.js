const express = require("express");
const router = express.Router();
const {
  createEquipment,
  getEquipmentsByInstructor,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  addMaintenance,
  getEquipmentStats
} = require("../controllers/equipmentController");

/**
 * @swagger
 * /api/equipments/instructor/{instructorId}:
 *   post:
 *     summary: Cadastra novo equipamento para um instrutor.
 *     description: Cria um novo equipamento associado ao instrutor.
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         type: string
 *         description: ID do instrutor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do equipamento
 *               category:
 *                 type: string
 *                 enum: [cardio, musculacao, funcional, crossfit, outros]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               acquisitionDate:
 *                 type: string
 *                 format: date
 *               condition:
 *                 type: string
 *                 enum: [novo, otimo, bom, regular, manutencao]
 *               location:
 *                 type: string
 *               observations:
 *                 type: string
 *               gymId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Equipamento cadastrado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       500:
 *         description: Erro no servidor.
 */
router.post("/instructor/:instructorId", createEquipment);

/**
 * @swagger
 * /api/equipments/instructor/{instructorId}:
 *   get:
 *     summary: Lista equipamentos de um instrutor.
 *     description: Retorna todos os equipamentos cadastrados por um instrutor específico.
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         type: string
 *       - in: query
 *         name: category
 *         type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: condition
 *         type: string
 *         description: Filtrar por condição
 *       - in: query
 *         name: isAvailable
 *         type: boolean
 *         description: Filtrar por disponibilidade
 *     responses:
 *       200:
 *         description: Lista de equipamentos retornada com sucesso.
 *       500:
 *         description: Erro no servidor.
 */
router.get("/instructor/:instructorId", getEquipmentsByInstructor);

/**
 * @swagger
 * /api/equipments/instructor/{instructorId}/stats:
 *   get:
 *     summary: Estatísticas dos equipamentos do instrutor.
 *     description: Retorna estatísticas agregadas dos equipamentos.
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso.
 *       500:
 *         description: Erro no servidor.
 */
router.get("/instructor/:instructorId/stats", getEquipmentStats);

/**
 * @swagger
 * /api/equipments/{equipmentId}:
 *   get:
 *     summary: Busca equipamento por ID.
 *     description: Retorna detalhes de um equipamento específico.
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Equipamento encontrado.
 *       404:
 *         description: Equipamento não encontrado.
 *       500:
 *         description: Erro no servidor.
 */
router.get("/:equipmentId", getEquipmentById);

/**
 * @swagger
 * /api/equipments/{equipmentId}:
 *   put:
 *     summary: Atualiza equipamento.
 *     description: Atualiza informações de um equipamento existente.
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Equipamento atualizado com sucesso.
 *       404:
 *         description: Equipamento não encontrado.
 *       500:
 *         description: Erro no servidor.
 */
router.put("/:equipmentId", updateEquipment);

/**
 * @swagger
 * /api/equipments/{equipmentId}:
 *   delete:
 *     summary: Remove equipamento.
 *     description: Deleta um equipamento do sistema.
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Equipamento removido com sucesso.
 *       404:
 *         description: Equipamento não encontrado.
 *       500:
 *         description: Erro no servidor.
 */
router.delete("/:equipmentId", deleteEquipment);

/**
 * @swagger
 * /api/equipments/{equipmentId}/maintenance:
 *   post:
 *     summary: Registra manutenção do equipamento.
 *     description: Adiciona entrada no histórico de manutenção.
 *     parameters:
 *       - in: path
 *         name: equipmentId
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *               performedBy:
 *                 type: string
 *               cost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Manutenção registrada com sucesso.
 *       404:
 *         description: Equipamento não encontrado.
 *       500:
 *         description: Erro no servidor.
 */
router.post("/:equipmentId/maintenance", addMaintenance);

module.exports = router;
