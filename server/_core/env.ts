import { randomBytes } from "node:crypto";

export const ENV = {
  appId: process.env.VITE_APP_ID || "arboviroses-alertas",
  cookieSecret:
    process.env.JWT_SECRET ||
    (() => {
      if (process.env.NODE_ENV === "production") {
        console.error("[Env] JWT_SECRET não definido — gere uma chave segura para produção.");
      }
      return randomBytes(32).toString("hex");
    })(),
  databaseUrl: process.env.DATABASE_URL ?? "file:./data/app.db",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
