export const FIXED_ACCOUNTS = ["admin"] as const;

export function isFixedInstitutionalUsername(username: string): boolean {
  return FIXED_ACCOUNTS.includes(username.toLowerCase() as (typeof FIXED_ACCOUNTS)[number]);
}

export function isFixedInstitutionalOpenId(openId: string): boolean {
  return openId === "local:admin" || /^local:usuario-[a-z0-9]{4}$/.test(openId);
}
