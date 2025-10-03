const express = require("express");
const router = express.Router();
const { authenticate: authMiddleware } = require("../middleware/authMiddleware");
const { 
  createWorkoutPlan, 
  getWorkoutPlans, 
  getPlanStudents, 
  unassignStudentFromPlan,
  getWorkoutPlansDetailed,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutPlanById
} = require("../controllers/workoutPlanController");

/**
 * @swagger
 * /api/workout/workout-plans:
 *   post:
 *     summary: Cria uma nova ficha de treino.
 *     description: Permite que um instrutor crie uma ficha de treino com divisões e exercícios.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - divisions
 *             properties:
 *               name:
 *                 type: string
 *               divisions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - exercises
 *                   properties:
 *                     name:
 *                       type: string
 *                     exercises:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - name
 *                           - sets
 *                           - reps
 *                           - idealWeight
 *                         properties:
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           image:
 *                             type: string
 *                           sets:
 *                             type: integer
 *                           reps:
 *                             type: integer
 *                           idealWeight:
 *                             type: number
 *     responses:
 *       201:
 *         description: Ficha de treino criada com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       500:
 *         description: Erro ao criar ficha de treino.
 */
router.post("/workout-plans", authMiddleware, createWorkoutPlan);

/**
 * @swagger
 * /api/workout/workout-plans:
 *   get:
 *     summary: Lista todas as fichas de treino.
 *     description: Retorna todas as fichas de treino cadastradas.
 *     responses:
 *       200:
 *         description: Fichas de treino listadas com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   divisions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         exercises:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               image:
 *                                 type: string
 *                               sets:
 *                                 type: integer
 *                               reps:
 *                                 type: integer
 *                               idealWeight:
 *                                 type: number
 *       500:
 *         description: Erro ao buscar fichas de treino.
 */
router.get("/workout-plans", getWorkoutPlans);

/**
 * @swagger
 * /api/students/{studentId}/assign-workout-plan:
 *   put:
 *     summary: Atribui uma ficha de treino a um aluno.
 *     description: Associa uma ficha de treino existente a um aluno específico.
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
 *     responses:
 *       200:
 *         description: Ficha de treino atribuída com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       500:
 *         description: Erro ao atribuir ficha de treino.
 */
// router.put("/:studentId/assign-workout-plan", assignWorkoutPlanToStudent);

// Nova rota para buscar planos detalhados
router.get("/workout-plans-detailed", authMiddleware, getWorkoutPlansDetailed);

// Buscar plano específico por ID
router.get("/workout-plans/:id", authMiddleware, getWorkoutPlanById);

// Atualizar plano de treino
router.put("/workout-plans/:id", authMiddleware, updateWorkoutPlan);

// Deletar plano de treino
router.delete("/workout-plans/:id", authMiddleware, deleteWorkoutPlan);

// Rotas para gerenciar alunos de um plano
router.get("/workout-plans/:planId/students", getPlanStudents);
router.delete("/workout-plans/:planId/students/:studentId", unassignStudentFromPlan);

module.exports = router;