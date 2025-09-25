const express = require("express");
const router = express.Router();
const { 
  getStudents,
  createStudent, 
  getStudentById,
  updateStudent,
  deleteStudent,
  unassignInstructor,
  addProgress
} = require("../controllers/studentController");

// Middleware de autenticação
const authMiddleware = require("../middleware/authMiddleware");

// Rotas principais
router.get("/", authMiddleware, getStudents);
router.post("/", authMiddleware, createStudent);
router.get("/:studentId", authMiddleware, getStudentById);
router.put("/:studentId", authMiddleware, updateStudent);
router.delete("/:studentId", authMiddleware, deleteStudent);
router.delete("/:studentId/instructor", authMiddleware, unassignInstructor);
router.post("/:studentId/progress", authMiddleware, addProgress);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Lista todos os alunos com opções de filtro
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, paused, inactive]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasInstructor
 *         schema:
 *           type: string
 *           enum: [true, false]
 *   post:
 *     summary: Cria um novo aluno
 *     description: Permite criar um aluno com dados completos (informações pessoais, restrições de saúde, metas, preferências).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - personalInfo
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário associado ao aluno.
 *               instructorId:
 *                 type: string
 *                 description: ID do instrutor responsável (opcional).
 *               personalInfo:
 *                 type: object
 *                 required: ["weight", "height", "availability"]
 *                 properties:
 *                   weight:
 *                     type: number
 *                     description: Peso em kg
 *                   height:
 *                     type: number
 *                     description: Altura em cm
 *                   trainingExperience:
 *                     type: string
 *                     enum: ["sedentário", "iniciante", "intermediário", "avançado"]
 *                   location:
 *                     type: object
 *                     properties:
 *                       city:
 *                         type: string
 *                       neighborhood:
 *                         type: string
 *                       preferredTrainingType:
 *                         type: string
 *                         enum: ["presencial", "online", "ambos"]
 *                   availability:
 *                     type: object
 *                     required: ["trainingDays", "preferredTime"]
 *                     properties:
 *                       trainingDays:
 *                         type: array
 *                         items: { type: string }
 *                         enum: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
 *                       preferredTime:
 *                         type: string
 *                         enum: ["manhã", "tarde", "noite"]
 *               healthRestrictions:
 *                 type: object
 *                 properties:
 *                   injuries:
 *                     type: array
 *                     items: { type: string }
 *                   chronicConditions:
 *                     type: array
 *                     items: { type: string }
 *                   medications:
 *                     type: array
 *                     items: { type: string }
 *                   medicalAuthorization:
 *                     type: boolean
 *                   doctorContact:
 *                     type: string
 *                   notes:
 *                     type: string
 *               goals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     targetValue:
 *                       type: number
 *                     currentValue:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: ["in-progress", "achieved", "canceled"]
 *               preferences:
 *                 type: object
 *                 properties:
 *                   trainingDays:
 *                     type: array
 *                     items: { type: string }
 *                     enum: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
 *                   preferredTime:
 *                     type: string
 *                     enum: ["manhã", "tarde", "noite"]
 *               status:
 *                 type: string
 *                 enum: ["active", "paused", "inactive"]
 *                 default: "active"
 *     responses:
 *       201:
 *         description: Aluno criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 student:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Dados inválidos.
 *       500:
 *         description: Erro ao criar aluno.
 */
router.post("/", createStudent);

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
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     cpf:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     birthDate:
 *                       type: string
 *                 instructorId:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                 personalInfo:
 *                   type: object
 *                   properties:
 *                     weight:
 *                       type: number
 *                     height:
 *                       type: number
 *                     trainingExperience:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         city:
 *                           type: string
 *                         neighborhood:
 *                           type: string
 *                         preferredTrainingType:
 *                           type: string
 *                     availability:
 *                       type: object
 *                       properties:
 *                         trainingDays:
 *                           type: array
 *                           items: { type: string }
 *                         preferredTime:
 *                           type: string
 *                 healthRestrictions:
 *                   type: object
 *                   properties:
 *                     injuries:
 *                       type: array
 *                       items: { type: string }
 *                     chronicConditions:
 *                       type: array
 *                       items: { type: string }
 *                     medications:
 *                       type: array
 *                       items: { type: string }
 *                     medicalAuthorization:
 *                       type: boolean
 *                     doctorContact:
 *                       type: string
 *                     notes:
 *                       type: string
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
 * /api/students/instructor/{instructorId}:
 *   get:
 *     summary: Lista todos os alunos de um instrutor específico.
 *     description: Retorna uma lista de todos os alunos vinculados a um instrutor.
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         description: ID do instrutor.
 *         schema:
 *           type: string
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
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       cpf:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       birthDate:
 *                         type: string
 *                   preferences:
 *                     type: object
 *                     properties:
 *                       trainingDays:
 *                         type: array
 *                         items: { type: string }
 *                       preferredTime:
 *                         type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       404:
 *         description: Nenhum aluno encontrado para este instrutor.
 *       500:
 *         description: Erro ao buscar alunos.
 */
router.get("/instructor/:instructorId", getStudentsByInstructorId);

/**
 * @swagger
 * /api/students/unassigned:
 *   get:
 *     summary: Lista todos os alunos sem instrutor atribuído.
 *     description: Retorna uma lista de todos os alunos que não têm instrutor vinculado.
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
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       cpf:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       birthDate:
 *                         type: string
 *                   preferences:
 *                     type: object
 *                     properties:
 *                       trainingDays:
 *                         type: array
 *                         items: { type: string }
 *                       preferredTime:
 *                         type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       404:
 *         description: Nenhum aluno sem instrutor encontrado.
 *       500:
 *         description: Erro ao buscar alunos.
 */
router.get("/unassigned", getStudentsWithoutInstructor);

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