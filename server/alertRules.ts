export function isAlertPublished(scheduledFor: Date | string, now = new Date()): boolean {
  return new Date(scheduledFor).getTime() <= now.getTime();
}

export function resolveReadReceipt(existingReadAt: Date | null | undefined, now = new Date()) {
  if (existingReadAt) return { readAt: existingReadAt, alreadyRead: true };
  return { readAt: now, alreadyRead: false };
}
