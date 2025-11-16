const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Em produção, priorizar MONGO_URI (Atlas), em desenvolvimento/Docker usar MONGODB_URI
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error("MongoDB URI não está definida. Configure MONGODB_URI ou MONGO_URI no arquivo .env");
    }
    
    console.log(`🔌 Tentando conectar ao MongoDB...`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      tls: mongoUri.includes('mongodb+srv'), // TLS apenas para MongoDB Atlas
      retryWrites: true,
      w: "majority"
    });
    console.log("✅ Conexão com o MongoDB estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;