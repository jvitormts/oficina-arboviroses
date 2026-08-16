export function resolveReadReceipt(existingReadAt: Date | null | undefined, now = new Date()) {
  if (existingReadAt) return { readAt: existingReadAt, alreadyRead: true };
  return { readAt: now, alreadyRead: false };
}
