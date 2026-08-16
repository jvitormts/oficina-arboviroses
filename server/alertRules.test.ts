import { describe, expect, it } from "vitest";
import { resolveReadReceipt } from "./alertRules";

describe("regras de publicação e leitura", () => {
  it("registra data/hora na primeira leitura e preserva o registro existente", () => {
    const firstReadAt = new Date("2026-08-15T12:05:00.000Z");
    const priorReadAt = new Date("2026-08-15T11:00:00.000Z");

    expect(resolveReadReceipt(null, firstReadAt)).toEqual({ readAt: firstReadAt, alreadyRead: false });
    expect(resolveReadReceipt(priorReadAt, firstReadAt)).toEqual({ readAt: priorReadAt, alreadyRead: true });
  });
});
