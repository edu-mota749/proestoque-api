import "dotenv/config";
import { app } from "./app";
import { config } from "./config";
import { prisma } from "./prisma/client";

async function iniciar() {
  try {
    await prisma.$connect();
    console.log("Banco de dados conectado");

    app.listen(config.port, "0.0.0.0", () => {
      console.log(`ProEstoque API rodando em http://localhost:${config.port}`);
      console.log(`ProEstoque API rede local em http://0.0.0.0:${config.port}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

iniciar();