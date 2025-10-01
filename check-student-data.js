/**
 * Script de Diagnóstico - Verificar Dados do Aluno
 * 
 * Este script verifica se existe um documento Student para o usuário João
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Student = require('./models/student');
const WorkoutPlan = require('./models/workoutPlan');

async function checkStudentData() {
  try {
    // Conectar ao MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-tcc';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB\n');

    // 1. Buscar o usuário João
    console.log('🔍 Buscando usuário João...');
    const user = await User.findOne({ email: 'joao@teste.com' });
    
    if (!user) {
      console.log('❌ Usuário João não encontrado!');
      console.log('\n📝 Ação necessária: Criar usuário com email joao@teste.com');
      process.exit(1);
    }
    
    console.log('✅ Usuário encontrado:');
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}\n`);

    // 2. Buscar documento Student para este usuário
    console.log('🔍 Buscando documento Student para este usuário...');
    const student = await Student.findOne({ userId: user._id }).populate('workoutPlans');
    
    if (!student) {
      console.log('❌ Documento Student NÃO ENCONTRADO!');
      console.log('\n🔧 Este é o problema! O usuário existe, mas não tem um documento Student.');
      console.log('\n📝 Solução: Criar documento Student no MongoDB Compass:');
      console.log('\n{');
      console.log(`  "userId": { "$oid": "${user._id}" },`);
      console.log('  "instructorId": { "$oid": "66f1a2b3c4d5e6f7a8b9c0d2" },');
      console.log('  "workoutPlans": [');
      console.log('    { "$oid": "66f1a2b3c4d5e6f7a8b9c0d6" },');
      console.log('    { "$oid": "66f1a2b3c4d5e6f7a8b9c0d7" }');
      console.log('  ],');
      console.log('  "personalInfo": {');
      console.log('    "weight": 78,');
      console.log('    "height": 175,');
      console.log('    "trainingExperience": "intermediario"');
      console.log('  },');
      console.log('  "goals": [');
      console.log('    { "description": "Ganhar massa muscular", "targetDate": "2025-12-31" }');
      console.log('  ],');
      console.log('  "progressHistory": [],');
      console.log('  "workoutSummary": []');
      console.log('}');
      process.exit(1);
    }
    
    console.log('✅ Documento Student encontrado:');
    console.log(`   - ID: ${student._id}`);
    console.log(`   - UserID: ${student.userId}`);
    console.log(`   - InstructorID: ${student.instructorId || 'Não atribuído'}`);
    console.log(`   - Planos de treino: ${student.workoutPlans?.length || 0}\n`);

    // 3. Verificar planos de treino
    if (student.workoutPlans && student.workoutPlans.length > 0) {
      console.log('📋 Planos de treino do aluno:');
      student.workoutPlans.forEach((plan, index) => {
        console.log(`   ${index + 1}. ${plan.name}`);
        console.log(`      - ID: ${plan._id}`);
        console.log(`      - Tipo: ${plan.type || 'N/A'}`);
        console.log(`      - Divisões: ${plan.divisions?.length || 0}`);
      });
    } else {
      console.log('⚠️  Aluno não possui planos de treino atribuídos!');
      console.log('\n📝 Para adicionar planos, edite o documento Student no MongoDB Compass');
      console.log('   e adicione os IDs dos WorkoutPlans no array workoutPlans.');
    }

    // 4. Listar todos os planos disponíveis
    console.log('\n📚 Planos de treino disponíveis no banco:');
    const allPlans = await WorkoutPlan.find().select('_id name type');
    if (allPlans.length > 0) {
      allPlans.forEach((plan, index) => {
        console.log(`   ${index + 1}. ${plan.name}`);
        console.log(`      - ID: ${plan._id}`);
        console.log(`      - Tipo: ${plan.type || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  Nenhum plano de treino cadastrado no banco!');
    }

    console.log('\n✅ Diagnóstico concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao executar diagnóstico:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

checkStudentData();
