import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[DB] ERRO: Variável DATABASE_URL não está configurada.");
  process.exit(1);
}

try {
  console.log("[DB] Conectando ao PostgreSQL...");
  const client = postgres(url, { max: 1, connect_timeout: 10 });
  await client`select 1`;
  await client.end();
  console.log("[DB] Conexão OK ✓");
} catch (error) {
  console.error("[DB] ERRO: Não foi possível conectar ao PostgreSQL.");
  console.error("[DB] Verifique se a variável DATABASE_URL está configurada corretamente.");
  console.error("[DB] Detalhes:", error instanceof Error ? error.message : error);
  process.exit(1);
}
