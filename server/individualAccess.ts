import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "./passwords";
import { GeneratedCredentials, generateCredentials, isGeneratedUsername } from "./generatedCredentials";

type StoredGeneratedUser = { username: string | null; passwordHash: string | null } | undefined;

export function canAuthenticateGeneratedAccess(username: string, password: string, storedUser: StoredGeneratedUser): boolean {
  const normalized = username.toLowerCase();
  return Boolean(
    isGeneratedUsername(normalized) &&
    storedUser?.username === normalized &&
    verifyPassword(password, storedUser.passwordHash)
  );
}

export async function reserveUniqueGeneratedAccess(
  persist: (access: GeneratedCredentials & { passwordHash: string }) => Promise<void>,
  generator: () => GeneratedCredentials = generateCredentials,
  maxAttempts = 12
): Promise<GeneratedCredentials> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const credentials = generator();
    try {
      await persist({ ...credentials, passwordHash: hashPassword(credentials.password) });
      return credentials;
    } catch (error) {
      if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
    }
  }
  throw new TRPCError({ code: "CONFLICT", message: "Não foi possível gerar uma credencial única. Tente novamente." });
}

export type IndividualReadRecord = { alertId: number; userId: number; readAt: Date };

export function summarizeIndividualReads(records: IndividualReadRecord[], alertId: number) {
  const readers = new Map<number, IndividualReadRecord>();
  records.filter(record => record.alertId === alertId).forEach(record => readers.set(record.userId, record));
  return { total: readers.size, readers: Array.from(readers.values()).sort((a, b) => a.userId - b.userId) };
}
