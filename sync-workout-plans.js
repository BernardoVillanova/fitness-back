/**
 * Script de migração para sincronizar assignedStudents nos WorkoutPlans
 * 
 * Este script percorre todos os alunos que têm workoutPlanId definido
 * e garante que eles estejam no array assignedStudents do respectivo plano.
 * 
 * Uso: node sync-workout-plans.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/student");
const WorkoutPlan = require("./models/workoutPlan");

const syncWorkoutPlans = async () => {
  try {
    // Conectar ao MongoDB
    console.log("🔄 Conectando ao MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado ao MongoDB");

    // Buscar todos os alunos que têm plano de treino
    console.log("\n📊 Buscando alunos com planos de treino...");
    const studentsWithPlans = await Student.find({ 
      workoutPlanId: { $exists: true, $ne: null } 
    }).populate('workoutPlanId');

    console.log(`✅ Encontrados ${studentsWithPlans.length} alunos com planos atribuídos`);

    if (studentsWithPlans.length === 0) {
      console.log("ℹ️  Nenhum aluno com plano de treino encontrado.");
      await mongoose.disconnect();
      return;
    }

    // Agrupar alunos por plano
    const planStudentsMap = new Map();
    
    for (const student of studentsWithPlans) {
      if (student.workoutPlanId) {
        const planId = student.workoutPlanId._id.toString();
        if (!planStudentsMap.has(planId)) {
          planStudentsMap.set(planId, []);
        }
        planStudentsMap.get(planId).push(student._id);
      }
    }

    console.log(`\n📦 Processando ${planStudentsMap.size} planos de treino...`);

    let updatedCount = 0;
    let alreadySyncedCount = 0;

    // Atualizar cada plano
    for (const [planId, studentIds] of planStudentsMap.entries()) {
      const plan = await WorkoutPlan.findById(planId);
      
      if (!plan) {
        console.log(`⚠️  Plano ${planId} não encontrado (referência órfã)`);
        continue;
      }

      // Garantir que assignedStudents existe
      if (!plan.assignedStudents) {
        plan.assignedStudents = [];
      }

      // Verificar quais alunos precisam ser adicionados
      const studentsToAdd = studentIds.filter(
        studentId => !plan.assignedStudents.some(
          assignedId => assignedId.toString() === studentId.toString()
        )
      );

      if (studentsToAdd.length > 0) {
        plan.assignedStudents.push(...studentsToAdd);
        await plan.save();
        
        console.log(`✅ Plano "${plan.name}": Adicionados ${studentsToAdd.length} alunos`);
        updatedCount++;
      } else {
        console.log(`✔️  Plano "${plan.name}": Já sincronizado (${studentIds.length} alunos)`);
        alreadySyncedCount++;
      }
    }

    // Remover alunos órfãos dos planos (alunos que não existem mais ou mudaram de plano)
    console.log("\n🧹 Limpando referências órfãs...");
    const allPlans = await WorkoutPlan.find({});
    let cleanedCount = 0;

    for (const plan of allPlans) {
      if (!plan.assignedStudents || plan.assignedStudents.length === 0) continue;

      const validStudents = [];
      
      for (const studentId of plan.assignedStudents) {
        const student = await Student.findById(studentId);
        
        // Manter apenas se o aluno existe E tem este plano atribuído
        if (student && student.workoutPlanId && 
            student.workoutPlanId.toString() === plan._id.toString()) {
          validStudents.push(studentId);
        } else {
          console.log(`🧹 Removendo aluno órfão ${studentId} do plano "${plan.name}"`);
          cleanedCount++;
        }
      }

      if (validStudents.length !== plan.assignedStudents.length) {
        plan.assignedStudents = validStudents;
        await plan.save();
      }
    }

    // Resumo final
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA SINCRONIZAÇÃO");
    console.log("=".repeat(60));
    console.log(`✅ Planos atualizados: ${updatedCount}`);
    console.log(`✔️  Planos já sincronizados: ${alreadySyncedCount}`);
    console.log(`🧹 Referências órfãs removidas: ${cleanedCount}`);
    console.log(`📦 Total de planos processados: ${planStudentsMap.size}`);
    console.log(`👥 Total de alunos com planos: ${studentsWithPlans.length}`);
    console.log("=".repeat(60));

    // Validação final
    console.log("\n🔍 Validando sincronização...");
    const finalCheck = await WorkoutPlan.find({}).populate('assignedStudents');
    let totalAssignedStudents = 0;
    
    for (const plan of finalCheck) {
      totalAssignedStudents += plan.assignedStudents.length;
    }

    if (totalAssignedStudents === studentsWithPlans.length) {
      console.log("✅ Validação bem-sucedida! Todos os alunos estão sincronizados.");
    } else {
      console.log(`⚠️  Atenção: ${studentsWithPlans.length} alunos têm planos, mas ${totalAssignedStudents} estão nos arrays assignedStudents`);
    }

    console.log("\n✨ Sincronização concluída com sucesso!");

  } catch (error) {
    console.error("\n❌ Erro durante sincronização:", error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Desconectado do MongoDB");
  }
};

// Executar o script
console.log("🚀 Iniciando sincronização de planos de treino...\n");
syncWorkoutPlans();
