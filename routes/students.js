const express = require("express");
const router = express.Router();
const { 
  createStudent, 
  getAllStudents, 
  getStudentById, 
  updateStudent, 
  deleteStudent,
  addProgressLog,
  updateGoalStatus
} = require("../controllers/studentController");

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Cria um novo aluno.
 *     description: Permite que um instrutor crie um aluno e vincule ao usuário.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário associado ao aluno.
 *               instructorId:
 *                 type: string
 *                 description: ID do instrutor responsável (opcional).
 *               preferences:
 *                 type: object
 *                 properties:
 *                   trainingDays:
 *                     type: array
 *                     items: { type: string }
 *                   preferredTime:
 *                     type: string
 *                   notifications:
 *                     type: boolean
 *               status:
 *                 type: string
 *                 enum: ["active", "paused", "inactive"]
 *                 default: "active"
 *     responses:
 *       201:
 *         description: Aluno criado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       500:
 *         description: Erro ao criar aluno.
 */
router.post("/", createStudent);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Lista todos os alunos.
 *     description: Retorna uma lista de todos os alunos cadastrados.
 *     responses:
 *       200:
 *         description: Alunos listados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   instructorId:
 *                     type: string
 *                   preferences:
 *                     type: object
 *                     properties:
 *                       trainingDays:
 *                         type: array
 *                         items: { type: string }
 *                       preferredTime:
 *                         type: string
 *                       notifications:
 *                         type: boolean
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       404:
 *         description: Nenhum aluno encontrado.
 *       500:
 *         description: Erro ao buscar alunos.
 */
router.get("/", getAllStudents);

/**
 * @swagger
 * /api/students/{studentId}:
 *   get:
 *     summary: Busca detalhes de um aluno específico.
 *     description: Retorna todas as informações de um aluno pelo ID.
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: ID do aluno.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 instructorId:
 *                   type: string
 *                 currentWorkoutPlanId:
 *                   type: string
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       description:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                       endDate:
 *                         type: string
 *                       targetValue:
 *                         type: number
 *                       currentValue:
 *                         type: number
 *                       status:
 *                         type: string
 *                 progressHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       weight:
 *                         type: number
 *                       measurements:
 *                         type: object
 *                         properties:
 *                           chest:
 *                             type: number
 *                           waist:
 *                             type: number
 *                           hips:
 *                             type: number
 *                           thighs:
 *                             type: number
 *                           arms:
 *                             type: number
 *                       bodyFatPercentage:
 *                         type: number
 *                       notes:
 *                         type: string
 *                 workoutHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       workoutPlanId:
 *                         type: string
 *                       date:
 *                         type: string
 *                       exercisesCompleted:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             exerciseId:
 *                               type: string
 *                             sets:
 *                               type: number
 *                             reps:
 *                               type: array
 *                               items: { type: number }
 *                             weightUsed:
 *                               type: number
 *                             notes:
 *                               type: string
 *                       status:
 *                         type: string
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     trainingDays:
 *                       type: array
 *                       items: { type: string }
 *                     preferredTime:
 *                       type: string
 *                     notifications:
 *                       type: boolean
 *                 status:
 *                   type: string
 *       404:
 *         description: Aluno não encontrado.
 *       500:
 *         description: Erro ao buscar aluno.
 */
router.get("/:studentId", getStudentById);

/**
 * @swagger
 * /api/students/{studentId}:
 *   put:
 *     summary: Atualiza informações de um aluno.
 *     description: Permite atualizar dados do aluno (status, instrutor, preferências, etc.).
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: ID do aluno.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instructorId:
 *                 type: string
 *               preferences:
 *                 type: object
 *                 properties:
 *                   trainingDays:
 *                     type: array
 *                     items: { type: string }
 *                   preferredTime:
 *                     type: string
 *                   notifications:
 *                     type: boolean
 *               status:
 *                 type: string
 *                 enum: ["active", "paused", "inactive"]
 *     responses:
 *       200:
 *         description: Aluno atualizado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       404:
 *         description: Aluno não encontrado.
 *       500:
 *         description: Erro ao atualizar aluno.
 */
router.put("/:studentId", updateStudent);

/**
 * @swagger
 * /api/students/{studentId}/progress:
 *   post:
 *     summary: Adiciona um registro de progresso ao aluno.
 *     description: Permite registrar medidas corporais e observações.
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: ID do aluno.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["weight", "measurements"]
 *             properties:
 *               weight:
 *                 type: number
 *               measurements:
 *                 type: object
 *                 properties:
 *                   chest:
 *                     type: number
 *                   waist:
 *                     type: number
 *                   hips:
 *                     type: number
 *                   thighs:
 *                     type: number
 *                   arms:
 *                     type: number
 *               bodyFatPercentage:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Progresso registrado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       404:
 *         description: Aluno não encontrado.
 *       500:
 *         description: Erro ao registrar progresso.
 */
router.post("/:studentId/progress", addProgressLog);

/**
 * @swagger
 * /api/students/{studentId}/goals/{goalId}:
 *   put:
 *     summary: Atualiza o status de uma meta do aluno.
 *     description: Permite alterar o status de uma meta específica.
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["in-progress", "achieved", "canceled"]
 *     responses:
 *       200:
 *         description: Status da meta atualizado.
 *       400:
 *         description: Dados inválidos.
 *       404:
 *         description: Meta ou aluno não encontrado.
 *       500:
 *         description: Erro ao atualizar status da meta.
 */
router.put("/:studentId/goals/:goalId", updateGoalStatus);

module.exports = router;