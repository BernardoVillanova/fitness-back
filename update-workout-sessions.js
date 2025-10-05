/**
 * Script para atualizar WorkoutSessions existentes adicionando instructorId
 * Execute: node update-workout-sessions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Modelos
const WorkoutSession = require('./models/workoutSession');
const Student = require('./models/student');

async function updateWorkoutSessions() {
  try {
    console.log('🔄 Iniciando atualização das WorkoutSessions...');

    // Buscar todas as sessões que não têm instructorId
    const sessionsWithoutInstructor = await WorkoutSession.find({
      instructorId: { $exists: false }
    }).populate('studentId');

    console.log(`📊 Encontradas ${sessionsWithoutInstructor.length} sessões sem instructorId`);

    let updated = 0;
    let errors = 0;

    for (const session of sessionsWithoutInstructor) {
      try {
        if (session.studentId && session.studentId.instructorId) {
          await WorkoutSession.updateOne(
            { _id: session._id },
            { $set: { instructorId: session.studentId.instructorId } }
          );
          updated++;
          
          if (updated % 10 === 0) {
            console.log(`✅ Atualizadas ${updated} sessões...`);
          }
        } else {
          console.log(`⚠️ Sessão ${session._id} - aluno sem instrutor`);
          errors++;
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar sessão ${session._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📋 Resumo da atualização:');
    console.log(`✅ Sessões atualizadas: ${updated}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📊 Total processadas: ${sessionsWithoutInstructor.length}`);

    // Verificar se a atualização funcionou
    const remainingSessions = await WorkoutSession.find({
      instructorId: { $exists: false }
    });

    console.log(`\n🔍 Sessões ainda sem instructorId: ${remainingSessions.length}`);

    if (remainingSessions.length === 0) {
      console.log('🎉 Todas as sessões foram atualizadas com sucesso!');
    }

  } catch (error) {
    console.error('💥 Erro na atualização:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Executar atualização
updateWorkoutSessions();