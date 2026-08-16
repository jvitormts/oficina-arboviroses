import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[Migrate] ERRO: Variável DATABASE_URL não está configurada.");
  process.exit(1);
}

try {
  console.log("[Migrate] Verificando schema do banco...");
  const connection = await mysql.createConnection(url);

  const [scheduledCols] = (await connection.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'scheduledFor'"
  )) as [unknown[], unknown];

  if (scheduledCols.length > 0) {
    await connection.query("ALTER TABLE alerts DROP COLUMN scheduledFor");
    console.log("[Migrate] Coluna scheduledFor removida.");
  }

  const [publishedCols] = (await connection.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'publishedAt'"
  )) as [unknown[], unknown];

  if (publishedCols.length === 0) {
    await connection.query("ALTER TABLE alerts ADD COLUMN publishedAt TIMESTAMP NULL DEFAULT NULL");
    console.log("[Migrate] Coluna publishedAt criada.");
  }

  await connection.end();
  console.log("[Migrate] Migração concluída ✓");
} catch (error) {
  console.error("[Migrate] ERRO:", error instanceof Error ? error.message : error);
  process.exit(1);
}
