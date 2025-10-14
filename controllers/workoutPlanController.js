const WorkoutPlan = require("../models/workoutPlan");
const Student = require("../models/student");

exports.createWorkoutPlan = async (req, res) => {
  const { name, divisions, description, goal, assignedStudents } = req.body;

  // Validação de campos obrigatórios
  if (!name || !divisions) {
    return res.status(400).json({ message: "Nome e divisões são obrigatórios." });
  }

  try {
    // SEMPRE usar o instructorId do token JWT
    const instructorId = req.user?.instructorId || req.user?._id;
    
    if (!instructorId) {
      return res.status(401).json({ message: "Instrutor não autenticado." });
    }

    console.log('➕ Criando plano para instrutor:', instructorId);

    const workoutPlan = new WorkoutPlan({ 
      name,
      description,
      goal,
      divisions,
      instructorId: instructorId,
      assignedStudents: [] // Sempre inicializa vazio
    });
    
    await workoutPlan.save();
    console.log('✅ Plano criado:', workoutPlan._id);

    // Se tiver alunos para associar, fazer sincronização bidirecional
    if (assignedStudents && assignedStudents.length > 0) {
      console.log('🔗 Associando', assignedStudents.length, 'alunos ao plano');
      
      // Adicionar alunos ao plano
      workoutPlan.assignedStudents = assignedStudents;
      await workoutPlan.save();

      // Adicionar plano aos alunos (sincronização bidirecional)
      await Student.updateMany(
        { _id: { $in: assignedStudents } },
        { 
          $addToSet: { workoutPlans: workoutPlan._id },
          workoutPlanId: workoutPlan._id // Mantém compatibilidade
        }
      );
      
      console.log('✅ Alunos associados com sucesso');
    }

    res.status(201).json(workoutPlan);
  } catch (error) {
    console.error('❌ Erro ao criar plano:', error);
    res.status(500).json({ message: "Erro interno ao criar ficha de treino." });
  }
};

exports.getWorkoutPlans = async (req, res) => {
  try {
    const workoutPlans = await WorkoutPlan.find()
      .populate('assignedStudents', 'name email profileImage')
      .populate('instructorId', 'name email')
      .sort({ updatedAt: -1 });
    
    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ message: "Erro interno ao buscar fichas de treino." });
  }
};

exports.assignWorkoutPlanToStudent = async (req, res) => {
  const { studentId } = req.params;
  const { workoutPlanId } = req.body;

  try {
    console.log('🔗 Associando aluno', studentId, 'ao plano', workoutPlanId);
    
    // Verifica se o aluno existe
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    // Verifica se o plano de treino existe
    const workoutPlan = await WorkoutPlan.findById(workoutPlanId);
    if (!workoutPlan) {
      return res.status(404).json({ message: "Plano de treino não encontrado." });
    }

    // ===== SINCRONIZAÇÃO BIDIRECIONAL =====
    
    // 1. Adicionar plano ao array workoutPlans do aluno (se não existir)
    if (!student.workoutPlans) {
      student.workoutPlans = [];
    }
    if (!student.workoutPlans.includes(workoutPlanId)) {
      student.workoutPlans.push(workoutPlanId);
      console.log('✅ Plano adicionado ao array workoutPlans do aluno');
    }
    
    // 2. Definir como plano atual (mantém compatibilidade com código existente)
    student.workoutPlanId = workoutPlanId;
    student.currentWorkoutPlanId = workoutPlanId;
    
    await student.save();
    console.log('✅ Aluno atualizado');

    // 3. Adicionar aluno à lista assignedStudents do plano (se não existir)
    if (!workoutPlan.assignedStudents.includes(studentId)) {
      workoutPlan.assignedStudents.push(studentId);
      await workoutPlan.save();
      console.log('✅ Aluno adicionado ao plano');
    }

    res.status(200).json({ 
      message: "Ficha de treino atribuída com sucesso!",
      student: {
        _id: student._id,
        name: student.name,
        workoutPlans: student.workoutPlans,
        currentWorkoutPlanId: student.currentWorkoutPlanId
      },
      workoutPlan: {
        _id: workoutPlan._id,
        name: workoutPlan.name,
        assignedStudents: workoutPlan.assignedStudents
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atribuir plano:', error);
    res.status(500).json({ message: "Erro interno ao atribuir ficha de treino." });
  }
};

// Buscar alunos associados a um plano
exports.getPlanStudents = async (req, res) => {
  const { planId } = req.params;

  try {
    const workoutPlan = await WorkoutPlan.findById(planId)
      .populate('assignedStudents', 'name email profileImage status');
    
    if (!workoutPlan) {
      return res.status(404).json({ message: "Plano de treino não encontrado." });
    }

    res.status(200).json(workoutPlan.assignedStudents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar alunos do plano." });
  }
};

// Remover associação de aluno com plano
exports.unassignStudentFromPlan = async (req, res) => {
  const { planId, studentId } = req.params;

  try {
    console.log('🔓 Desassociando aluno', studentId, 'do plano', planId);
    
    const workoutPlan = await WorkoutPlan.findById(planId);
    if (!workoutPlan) {
      return res.status(404).json({ message: "Plano de treino não encontrado." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    // ===== SINCRONIZAÇÃO BIDIRECIONAL - REMOÇÃO =====
    
    // 1. Remove aluno da lista assignedStudents do plano
    workoutPlan.assignedStudents = workoutPlan.assignedStudents.filter(
      id => id.toString() !== studentId
    );
    await workoutPlan.save();
    console.log('✅ Aluno removido do plano');

    // 2. Remove plano do array workoutPlans do aluno
    if (student.workoutPlans && Array.isArray(student.workoutPlans)) {
      student.workoutPlans = student.workoutPlans.filter(
        id => id.toString() !== planId
      );
      console.log('✅ Plano removido do array workoutPlans do aluno');
    }

    // 3. Remove referência do plano atual se for o mesmo
    if (student.workoutPlanId && student.workoutPlanId.toString() === planId) {
      student.workoutPlanId = null;
      console.log('✅ workoutPlanId zerado');
    }
    
    if (student.currentWorkoutPlanId && student.currentWorkoutPlanId.toString() === planId) {
      student.currentWorkoutPlanId = null;
      console.log('✅ currentWorkoutPlanId zerado');
    }
    
    await student.save();

    res.status(200).json({ 
      message: "Aluno desassociado do plano com sucesso!",
      student: {
        _id: student._id,
        name: student.name,
        workoutPlans: student.workoutPlans,
        currentWorkoutPlanId: student.currentWorkoutPlanId
      },
      workoutPlan: {
        _id: workoutPlan._id,
        name: workoutPlan.name,
        assignedStudents: workoutPlan.assignedStudents
      }
    });
  } catch (error) {
    console.error('❌ Erro ao desassociar aluno do plano:', error);
    res.status(500).json({ message: "Erro ao desassociar aluno do plano." });
  }
};

// Buscar planos com informações detalhadas incluindo contagem de alunos
exports.getWorkoutPlansDetailed = async (req, res) => {
  try {
    // SEMPRE filtrar pelo instrutor logado (do token JWT)
    const instructorId = req.user?.instructorId || req.user?._id;
    
    if (!instructorId) {
      return res.status(401).json({ message: "Instrutor não autenticado." });
    }

    console.log('🔍 Buscando planos do instrutor:', instructorId);

    const workoutPlans = await WorkoutPlan.find({ instructorId: instructorId })
      .populate('assignedStudents', 'name email profileImage status')
      .populate('instructorId', 'name email')
      .sort({ updatedAt: -1 })
      .lean(); // Converte para objeto JavaScript simples
    
    console.log('✅ Planos encontrados:', workoutPlans.length);
    
    const Exercise = require("../models/exercise");
    const allExercises = await Exercise.find({ instructorId: instructorId }).lean();
        
    const exerciseMap = {};
    allExercises.forEach(exercise => {
      exerciseMap[exercise.name] = exercise;
    });
    
    workoutPlans.forEach((plan, planIndex) => {
      plan.divisions?.forEach((division, divIndex) => {
        division.exercises?.forEach((exercise, exIndex) => {
          
          if (exerciseMap[exercise.name]) {
            const fullExercise = exerciseMap[exercise.name];
            
            exercise.image = exercise.image || fullExercise.image;
            exercise.description = exercise.description || fullExercise.description || fullExercise.howToPerform;
            exercise.muscleGroups = exercise.muscleGroups || fullExercise.muscleGroups;
          }
        });
      });
    });
    
    // Adicionar contagem de alunos e validar dados
    const plansWithStats = workoutPlans.map(plan => {
      // Garantir que assignedStudents seja um array
      const students = Array.isArray(plan.assignedStudents) ? plan.assignedStudents : [];
      
      return {
        ...plan,
        assignedStudents: students,
        studentsCount: students.length,
        // Calcular total de exercícios
        totalExercises: plan.divisions?.reduce((total, div) => 
          total + (div.exercises?.length || 0), 0
        ) || 0
      };
    });

    res.status(200).json(plansWithStats);
  } catch (error) {
    console.error('Erro ao buscar planos detalhados:', error);
    res.status(500).json({ 
      message: "Erro ao buscar planos de treino.",
      error: error.message 
    });
  }
};

exports.updateWorkoutPlan = async (req, res) => {
  const { id } = req.params;
  const { name, description, goal, divisions, assignedStudents } = req.body;

  try {
    const instructorId = req.user?.instructorId || req.user?._id;
    
    if (!instructorId) {
      return res.status(401).json({ message: "Instrutor não autenticado." });
    }

    console.log('✏️ Atualizando plano:', id);

    // Verificar se o plano existe e pertence ao instrutor
    const workoutPlan = await WorkoutPlan.findOne({ 
      _id: id, 
      instructorId: instructorId 
    });

    if (!workoutPlan) {
      return res.status(404).json({ message: "Plano de treino não encontrado ou sem permissão." });
    }

    // Atualizar campos
    if (name) workoutPlan.name = name;
    if (description !== undefined) workoutPlan.description = description;
    if (goal) workoutPlan.goal = goal;
    if (divisions) workoutPlan.divisions = divisions;

    // Se assignedStudents foi fornecido, atualizar sincronização bidirecional
    if (assignedStudents !== undefined) {
      const oldStudents = workoutPlan.assignedStudents.map(s => s.toString());
      const newStudents = assignedStudents.map(s => s.toString());

      // Alunos removidos
      const removedStudents = oldStudents.filter(s => !newStudents.includes(s));
      if (removedStudents.length > 0) {
        await Student.updateMany(
          { _id: { $in: removedStudents } },
          { 
            $pull: { workoutPlans: workoutPlan._id },
            $unset: { workoutPlanId: "", currentWorkoutPlanId: "" }
          }
        );
        console.log('🗑️ Removidos', removedStudents.length, 'alunos');
      }

      // Alunos adicionados
      const addedStudents = newStudents.filter(s => !oldStudents.includes(s));
      if (addedStudents.length > 0) {
        await Student.updateMany(
          { _id: { $in: addedStudents } },
          { 
            $addToSet: { workoutPlans: workoutPlan._id },
            workoutPlanId: workoutPlan._id
          }
        );
        console.log('➕ Adicionados', addedStudents.length, 'alunos');
      }

      workoutPlan.assignedStudents = assignedStudents;
    }

    await workoutPlan.save();
    console.log('✅ Plano atualizado com sucesso');

    // Retornar plano atualizado com populações
    const updatedPlan = await WorkoutPlan.findById(workoutPlan._id)
      .populate('assignedStudents', 'name email profileImage status')
      .populate('instructorId', 'name email')
      .lean();

    res.status(200).json(updatedPlan);
  } catch (error) {
    console.error('❌ Erro ao atualizar plano:', error);
    res.status(500).json({ 
      message: "Erro ao atualizar plano de treino.",
      error: error.message 
    });
  }
};

exports.deleteWorkoutPlan = async (req, res) => {
  const { id } = req.params;

  try {
    const instructorId = req.user?.instructorId || req.user?._id;
    
    if (!instructorId) {
      return res.status(401).json({ message: "Instrutor não autenticado." });
    }

    console.log('🗑️ Deletando plano:', id);

    // Verificar se o plano existe e pertence ao instrutor
    const workoutPlan = await WorkoutPlan.findOne({ 
      _id: id, 
      instructorId: instructorId 
    });

    if (!workoutPlan) {
      return res.status(404).json({ message: "Plano de treino não encontrado ou sem permissão." });
    }

    // Remover referências nos alunos (sincronização bidirecional)
    if (workoutPlan.assignedStudents.length > 0) {
      await Student.updateMany(
        { _id: { $in: workoutPlan.assignedStudents } },
        { 
          $pull: { workoutPlans: workoutPlan._id },
          $unset: { workoutPlanId: "", currentWorkoutPlanId: "" }
        }
      );
      console.log('🗑️ Removidas referências de', workoutPlan.assignedStudents.length, 'alunos');
    }

    await WorkoutPlan.deleteOne({ _id: id });
    console.log('✅ Plano deletado com sucesso');

    res.status(200).json({ message: "Plano de treino excluído com sucesso." });
  } catch (error) {
    console.error('❌ Erro ao deletar plano:', error);
    res.status(500).json({ 
      message: "Erro ao deletar plano de treino.",
      error: error.message 
    });
  }
};

exports.getWorkoutPlanById = async (req, res) => {
  const { id } = req.params;

  try {
    const instructorId = req.user?.instructorId || req.user?._id;
    
    if (!instructorId) {
      return res.status(401).json({ message: "Instrutor não autenticado." });
    }

    console.log('🔍 Buscando plano:', id);

    const workoutPlan = await WorkoutPlan.findOne({ 
      _id: id, 
      instructorId: instructorId 
    })
      .populate('assignedStudents', 'name email profileImage status')
      .populate('instructorId', 'name email')
      .lean();

    if (!workoutPlan) {
      return res.status(404).json({ message: "Plano de treino não encontrado ou sem permissão." });
    }

    res.status(200).json(workoutPlan);
  } catch (error) {
    console.error('❌ Erro ao buscar plano:', error);
    res.status(500).json({ 
      message: "Erro ao buscar plano de treino.",
      error: error.message 
    });
  }
};