const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Student = require("../models/student"); // Novo: para criar aluno automaticamente
require("dotenv").config();

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário (aluno ou personal).
 *     description: Cadastra um usuário com CPF, nome, e-mail, senha, telefone, data de nascimento e papel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cpf
 *               - email
 *               - password
 *               - phone
 *               - birthDate
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               cpf:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               role:
 *                 type: string
 *                 enum: ["aluno", "personal"]
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso.
 *       400:
 *         description: E-mail ou CPF já cadastrado.
 *       500:
 *         description: Erro ao registrar usuário.
 */
router.post("/register", async (req, res) => {
  const { name, cpf, email, password, phone, birthDate, role } = req.body;

  try {
    if (!name || !cpf || !email || !password || !phone || !birthDate || !role) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "E-mail já registrado." });
    }

    const existingCpf = await User.findOne({ cpf });
    if (existingCpf) {
      return res.status(400).json({ message: "CPF já registrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      cpf,
      email,
      password: hashedPassword,
      phone,
      birthDate,
      role,
    });

    await newUser.save();

    // Se for aluno, criar perfil de aluno automaticamente
    if (role === "student") {
      const newStudent = new Student({
        userId: newUser._id,
        preferences: {
          trainingDays: [],
          preferredTime: "",
          notifications: true
        },
        healthRestrictions: {
          injuries: [],
          chronicConditions: [],
          medications: [],
          notes: ""
        },
        status: "active"
      });

      await newStudent.save();
    }

    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário.
 *     description: Faz login e retorna um token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem-sucedido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Credenciais inválidas.
 *       500:
 *         description: Erro ao realizar login.
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "1h" }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Erro ao realizar login." });
  }
});

module.exports = router;