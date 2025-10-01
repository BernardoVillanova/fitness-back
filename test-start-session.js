/**
 * Script de Teste - Iniciar Sessão de Treino
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WorkoutSession = require('./models/workoutSession');
const WorkoutPlan = require('./models/workoutPlan');
const Student = require('./models/student');
const User = require('./models/user');

async function testStartSession() {
  try {
    // Conectar ao MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB\n');

    // 1. Buscar usuário João
    const user = await User.findOne({ email: 'joao@teste.com' });
    console.log('1️⃣ Usuário encontrado:', user._id);

    // 2. Buscar Student
    const student = await Student.findOne({ userId: user._id });
    console.log('2️⃣ Student encontrado:', student._id);
    console.log('   - Planos de treino:', student.workoutPlans.length);

    // 3. Buscar primeiro plano de treino
    const workoutPlanId = student.workoutPlans[0];
    const workoutPlan = await WorkoutPlan.findById(workoutPlanId);
    console.log('3️⃣ WorkoutPlan encontrado:', workoutPlan._id);
    console.log('   - Nome:', workoutPlan.name);
    console.log('   - Divisões:', workoutPlan.divisions.length);

    // 4. Testar criação de sessão
    const divisionIndex = 0;
    const division = workoutPlan.divisions[divisionIndex];
    
    console.log('\n4️⃣ Testando criação de sessão...');
    console.log('   - Divisão:', division.name);
    console.log('   - Exercícios:', division.exercises.length);

    // Mapear exercícios
    const exercises = division.exercises.map((exercise, index) => {
      console.log(`   📋 Exercício ${index + 1}:`, {
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.idealWeight
      });
      
      return {
        exerciseId: exercise._id.toString(),
        exerciseName: exercise.name,
        sets: Array.from({ length: exercise.sets }, (_, i) => ({
          setNumber: i + 1,
          reps: exercise.reps,
          weight: exercise.idealWeight,
          completed: false
        })),
        completed: false
      };
    });

    // Criar sessão
    const newSession = new WorkoutSession({
      studentId: student._id,
      workoutPlanId: workoutPlan._id,
      workoutName: workoutPlan.name,
      divisionName: division.name,
      exercises,
      totalExercises: exercises.length,
      completedExercises: 0,
      startTime: new Date()
    });

    console.log('\n5️⃣ Salvando sessão...');
    await newSession.save();
    
    console.log('✅ Sessão criada com sucesso!');
    console.log('   - ID:', newSession._id);
    console.log('   - Status:', newSession.status);
    console.log('   - Exercícios:', newSession.exercises.length);

  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('Stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

testStartSession();
