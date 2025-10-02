const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Student = require("../models/student"); // Novo: para criar aluno automaticamente
const Instructor = require("../models/instructor");
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

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
    });
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

    // Retornar token e dados básicos do usuário
    res.status(200).json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cpf: user.cpf,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: "Erro ao realizar login." });
  }
});

/**
 * @swagger
 * /api/auth/user/{userId}:
 *   put:
 *     summary: Atualiza informações básicas do usuário.
 *     description: Permite atualizar nome, email, telefone e data de nascimento do usuário.
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso.
 *       400:
 *         description: Email já está em uso por outro usuário.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro ao atualizar usuário.
 */
router.put("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name, email, phone, birthDate } = req.body;

  try {
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Se está alterando o email, verificar se já não está em uso
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email já está em uso por outro usuário." });
      }
    }

    // Atualizar apenas os campos fornecidos
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (birthDate) user.birthDate = birthDate;

    await user.save();

    res.status(200).json({ 
      message: "Usuário atualizado com sucesso.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        birthDate: user.birthDate,
        cpf: user.cpf,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ message: "Erro ao atualizar usuário." });
  }
});

/**
 * @swagger
 * /api/auth/user/{userId}/avatar:
 *   post:
 *     summary: Upload de avatar do usuário
 *     description: Faz upload da foto de perfil do usuário
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar atualizado com sucesso
 *       400:
 *         description: Arquivo inválido
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao fazer upload
 */
const multer = require('multer');
const path = require('path');

// Configuração do multer para avatares
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/avatars/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.params.userId}-${uniqueSuffix}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Use JPG, PNG ou GIF.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('avatar');

router.post('/user/:userId/avatar', (req, res) => {
  avatarUpload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Erro no upload: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    try {
      const { userId } = req.params;
      
      // Atualizar usuário com URL do avatar
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      res.json({
        message: 'Avatar atualizado com sucesso!',
        avatarUrl: avatarUrl,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      res.status(500).json({ message: 'Erro ao atualizar avatar.' });
    }
  });
});

/**
 * @swagger
 * /api/users/without-instructor:
 *   get:
 *     summary: Lista usuários que não possuem instrutor vinculado
 *     description: Busca usuários com role "aluno" que ainda não estão vinculados a nenhum instrutor
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca (nome, email ou CPF)
 *     responses:
 *       200:
 *         description: Lista de usuários sem instrutor
 */
router.get('/users/without-instructor', async (req, res) => {
  try {
    const { search } = req.query;
    
    console.log('🔍 [WITHOUT-INSTRUCTOR] Buscando usuários sem instrutor...');
    
    // Buscar APENAS os Students que JÁ TÊM instructorId preenchido
    const studentsWithInstructor = await Student.find({ 
      instructorId: { $exists: true, $ne: null } 
    }).select('userId');
    
    const userIdsWithInstructor = studentsWithInstructor.map(s => s.userId?.toString()).filter(Boolean);
    
    console.log('📋 [WITHOUT-INSTRUCTOR] UserIds que JÁ TÊM instrutor:', userIdsWithInstructor);
    
    // Construir query de busca
    const query = {
      role: 'aluno',
      _id: { $nin: userIdsWithInstructor } // Excluir APENAS usuários que já têm instrutor
    };
    
    // Se houver termo de busca, adicionar filtros
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { cpf: searchRegex }
      ];
    }
    
    console.log('🔎 [WITHOUT-INSTRUCTOR] Query:', JSON.stringify(query, null, 2));
    
    // Buscar usuários
    const users = await User.find(query)
      .select('name email cpf avatar')
      .limit(50)
      .sort({ name: 1 });
    
    console.log(`✅ [WITHOUT-INSTRUCTOR] Encontrados ${users.length} usuários disponíveis`);
    
    res.json(users);
  } catch (error) {
    console.error('❌ [WITHOUT-INSTRUCTOR] Erro ao buscar usuários sem instrutor:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
});

module.exports = router;