import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[DB] ERRO: Variável DATABASE_URL não está configurada.");
  process.exit(1);
}

try {
  console.log("[DB] Conectando ao MySQL...");
  const connection = await mysql.createConnection(url);
  await connection.ping();
  await connection.end();
  console.log("[DB] Conexão OK ✓");
} catch (error) {
  console.error("[DB] ERRO: Não foi possível conectar ao MySQL.");
  console.error("[DB] Verifique se a variável DATABASE_URL está configurada corretamente.");
  console.error("[DB] Detalhes:", error instanceof Error ? error.message : error);
  process.exit(1);
}
