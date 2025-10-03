const express = require("express");
const router = express.Router();
const { authenticate: authMiddleware } = require("../middleware/authMiddleware");
const { 
  createStudent, 
  getStudentById, 
  getStudentByUserId,
  getStudentsByInstructorId,
  getStudentsWithoutInstructor,
  getStudents,
  updateStudent, 
  deleteStudent,
  unassignInstructor,
  addProgressLog,
  updateGoalStatus,
  getStudentProfile,
  assignWorkoutPlanToStudent
} = require("../controllers/studentController");

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Cria um novo aluno com informações detalhadas.
 *     description: Permite criar um aluno com dados completos (informações pessoais, restrições de saúde, metas, preferências).
 *     requestBody:
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
 * /api/students/link:
 *   post:
 *     summary: Vincula um usuário existente como aluno de um instrutor
 *     description: Cria um registro de Student para um usuário que ainda não possui instrutor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - instructorId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário a ser vinculado
 *               instructorId:
 *                 type: string
 *                 description: ID do instrutor
 *     responses:
 *       201:
 *         description: Aluno vinculado com sucesso
 *       400:
 *         description: Usuário já possui instrutor ou dados inválidos
 *       500:
 *         description: Erro ao vincular aluno
 */
router.post("/link", async (req, res) => {
  try {
    const { userId, instructorId } = req.body;

    console.log('📥 [LINK] Recebendo requisição de vínculo:', { userId, instructorId });

    if (!userId || !instructorId) {
      return res.status(400).json({ message: 'userId e instructorId são obrigatórios' });
    }

    // Verificar se o usuário existe
    const User = require('../models/user');
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ [LINK] Usuário não encontrado:', userId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    console.log('✅ [LINK] Usuário encontrado:', user.name);

    // Verificar se o instrutor existe
    const Instructor = require('../models/instructor');
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      console.log('❌ [LINK] Instrutor não encontrado:', instructorId);
      return res.status(404).json({ message: 'Instrutor não encontrado' });
    }
    console.log('✅ [LINK] Instrutor encontrado');

    // Buscar se já existe um Student para este userId
    const Student = require('../models/student');
    let student = await Student.findOne({ userId });

    console.log('🔍 [LINK] Buscando Student com userId:', userId);
    console.log('🔍 [LINK] Student encontrado:', student ? `SIM (ID: ${student._id})` : 'NÃO');

    if (student) {
      // Se já existe Student, verificar se já tem instrutor
      if (student.instructorId && student.instructorId.toString() !== instructorId) {
        console.log('⚠️ [LINK] Student já vinculado a outro instrutor:', student.instructorId);
        return res.status(400).json({ message: 'Este usuário já está vinculado a outro instrutor' });
      }
      
      // Atualizar APENAS o instructorId do Student existente
      console.log('🔄 [LINK] Atualizando instructorId do Student existente');
      student.instructorId = instructorId;
      student.status = 'active';
      await student.save();
      console.log('✅ [LINK] Student atualizado com sucesso');
    } else {
      // Se não existe Student, retornar erro
      console.log('❌ [LINK] Student não encontrado. Usuário deve completar cadastro primeiro');
      return res.status(404).json({ 
        message: 'Registro de aluno não encontrado. O usuário precisa completar o cadastro de aluno primeiro.' 
      });
    }

    // Retornar aluno vinculado populado
    const populatedStudent = await Student.findById(student._id)
      .populate('userId', 'name email cpf avatar')
      .populate('instructorId', 'userId');

    console.log('✅ [LINK] Vínculo concluído com sucesso');

    res.status(200).json({
      message: 'Aluno vinculado com sucesso',
      student: populatedStudent
    });
  } catch (error) {
    console.error('Erro ao vincular aluno:', error);
    res.status(500).json({ message: 'Erro ao vincular aluno', error: error.message });
  }
});

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
// IMPORTANTE: Rotas específicas devem vir ANTES das rotas genéricas
// /user/:userId deve vir antes de /:studentId

/**
 * @swagger
 * /api/students/user/{userId}:
 *   get:
 *     summary: Busca um aluno pelo userId.
 *     description: Retorna dados completos do aluno baseado no userId.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno encontrado.
 *       404:
 *         description: Aluno não encontrado.
 *       500:
 *         description: Erro ao buscar aluno.
 */

// Lista todos os alunos (com suporte para busca) - FILTRADO por instrutor logado
router.get("/", authMiddleware, getStudents);

router.get("/user/:userId", getStudentByUserId);

/**
 * @swagger
 * /api/students/{studentId}/profile:
 *   get:
 *     summary: Busca perfil completo do aluno com análises e estatísticas.
 *     description: Retorna dados agregados incluindo informações pessoais, histórico de treinos, progresso físico, metas e estatísticas completas.
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Perfil completo do aluno.
 *       404:
 *         description: Aluno não encontrado.
 *       500:
 *         description: Erro ao buscar perfil do aluno.
 */
router.get("/:studentId/profile", getStudentProfile);

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

/**
 * @swagger
 * /api/students/{studentId}/assign-workout-plan:
 *   put:
 *     summary: Atribui um plano de treino a um aluno.
 *     description: Associa um plano de treino ao aluno e sincroniza o array assignedStudents do plano.
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
 *             required:
 *               - workoutPlanId
 *             properties:
 *               workoutPlanId:
 *                 type: string
 *                 description: ID do plano de treino a ser atribuído.
 *     responses:
 *       200:
 *         description: Plano atribuído com sucesso.
 *       404:
 *         description: Aluno ou plano não encontrado.
 *       500:
 *         description: Erro ao atribuir plano.
 */
router.put("/:studentId/assign-workout-plan", assignWorkoutPlanToStudent);

module.exports = router;