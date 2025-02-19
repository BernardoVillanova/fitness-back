const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
require("dotenv").config();

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     description: Cadastra um usuário com nome, e-mail e senha.
 *     parameters:
 *       - in: body
 *         name: user
 *         description: Dados do usuário para cadastro.
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - email
 *             - password
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *       400:
 *         description: Usuário já existe
 */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  
  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ message: "Usuário já existe" });

  const hashedPassword = await bcrypt.hash(password, 10);
  user = new User({ name, email, password: hashedPassword });
  await user.save();

  res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário
 *     description: Faz login e retorna um token JWT.
 *     parameters:
 *       - in: body
 *         name: credentials
 *         description: Credenciais do usuário.
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - password
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       400:
 *         description: Credenciais inválidas
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Credenciais inválidas" });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

module.exports = router;
