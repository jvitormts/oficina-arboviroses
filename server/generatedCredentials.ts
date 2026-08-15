import { randomInt } from "node:crypto";

const HASH_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const WORDS = ["abacate", "alegria", "amora", "banana", "canela", "caju", "cereja", "cobertura", "cupuaçu", "flor", "girassol", "hortela", "jabuticaba", "limao", "manga", "mel", "morango", "noz", "orquidea", "pessego", "pitanga", "roma", "safira", "sol", "tucano", "violeta"];

export type GeneratedCredentials = { username: string; password: string };

export function isGeneratedUsername(username: string): boolean {
  return /^usuario-[a-z0-9]{4}$/.test(username);
}

export function generateCredentials(): GeneratedCredentials {
  const hash = Array.from({ length: 4 }, () => HASH_ALPHABET[randomInt(HASH_ALPHABET.length)]).join("");
  const word = WORDS[randomInt(WORDS.length)];
  const number = randomInt(10, 100);
  return { username: `usuario-${hash}`, password: `${word}${number}` };
}
