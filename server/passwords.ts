import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;

  const calculatedHash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");
  return (
    storedBuffer.length === calculatedBuffer.length &&
    timingSafeEqual(storedBuffer, calculatedBuffer)
  );
}
