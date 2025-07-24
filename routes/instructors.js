const express = require("express");
const router = express.Router();
const { createWorkoutPlan, getWorkoutPlans, getInstructors, createInstructor } = require("../controllers/instructorController");

/**
 * @swagger
 * /api/instructors:
 *   get:
 *     summary: Lista instrutores com filtros opcionais.
 *     description: Retorna instrutores com base em critérios como nome, especialidade ou localização.
 *     parameters:
 *       - in: query
 *         name: name
 *         type: string
 *         description: Busca por nome do instrutor (ex.: "Carlos").
 *       - in: query
 *         name: specialty
 *         type: string
 *         description: Filtra por especialidade (ex.: "Musculação").
 *       - in: query
 *         name: location
 *         type: string
 *         description: Filtra por cidade ou bairro (ex.: "São Paulo").
 *     responses:
 *       200:
 *         description: Instrutores listados com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Instructor'
 *       404:
 *         description: Nenhum instrutor encontrado.
 *       500:
 *         description: Erro ao buscar instrutores.
 */
router.get("/", getInstructors);

/**
 * @swagger
 * /api/instructors:
 *   post:
 *     summary: Cria um novo instrutor.
 *     description: Cadastra um novo instrutor com ID de usuário, certificações e especializações.
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
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de certificações
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Áreas de especialização
 *     responses:
 *       201:
 *         description: Instrutor criado com sucesso.
 *       400:
 *         description: Usuário já é instrutor.
 *       500:
 *         description: Erro ao criar instrutor.
 */
router.post("/", createInstructor);

/**
 * @swagger
 * /api/instructors/workout-plans/{studentId}:
 *   post:
 *     summary: Cria uma nova ficha de treino para um aluno.
 *     description: Permite que um instrutor crie uma ficha de treino para um aluno específico.
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
 *               - week
 *               - exercises
 *             properties:
 *               week:
 *                 type: integer
 *                 description: Semana da ficha de treino.
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     image:
 *                       type: string
 *                     sets:
 *                       type: integer
 *                     reps:
 *                       type: integer
 *                     idealWeight:
 *                       type: number
 *     responses:
 *       201:
 *         description: Ficha de treino criada com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       500:
 *         description: Erro ao criar ficha de treino.
 */
router.post("/workout-plans/:studentId", createWorkoutPlan);

/**
 * @swagger
 * /api/instructors/workout-plans/{studentId}:
 *   get:
 *     summary: Lista as fichas de treino de um aluno.
 *     description: Retorna todas as fichas de treino associadas a um aluno específico.
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: ID do aluno.
 *         schema:
 *           type: string
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
 *                   week:
 *                     type: integer
 *                   exercises:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         image:
 *                           type: string
 *                         sets:
 *                           type: integer
 *                         reps:
 *                           type: integer
 *                         idealWeight:
 *                           type: number
 *       404:
 *         description: Nenhuma ficha de treino encontrada.
 *       500:
 *         description: Erro ao buscar fichas de treino.
 */
router.get("/workout-plans/:studentId", getWorkoutPlans);

module.exports = router;