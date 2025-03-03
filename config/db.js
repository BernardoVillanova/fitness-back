const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Conexão com o MongoDB estabelecida com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;