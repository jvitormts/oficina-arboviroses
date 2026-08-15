import { describe, expect, it } from "vitest";
import { isAlertPublished, resolveReadReceipt } from "./alertRules";

describe("regras de publicação e leitura", () => {
  it("oculta alertas antes do horário programado e os libera no horário definido", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    expect(isAlertPublished("2026-08-15T12:00:01.000Z", now)).toBe(false);
    expect(isAlertPublished("2026-08-15T12:00:00.000Z", now)).toBe(true);
  });

  it("registra data/hora na primeira leitura e preserva o registro existente", () => {
    const firstReadAt = new Date("2026-08-15T12:05:00.000Z");
    const priorReadAt = new Date("2026-08-15T11:00:00.000Z");

    expect(resolveReadReceipt(null, firstReadAt)).toEqual({ readAt: firstReadAt, alreadyRead: false });
    expect(resolveReadReceipt(priorReadAt, firstReadAt)).toEqual({ readAt: priorReadAt, alreadyRead: true });
  });
});
