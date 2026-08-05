// Vietcombank's Napas BIN — public, documented constant, not a secret.
export const BANK_BIN = "970436";
export const BANK_ACCOUNT_NUMBER = "0271000710321";
export const BANK_ACCOUNT_NAME = "QUANG VAN HAI";
export const BANK_LABEL = "Vietcombank";

export function buildVietQrUrl(amount: number, content: string): string {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: content,
    accountName: BANK_ACCOUNT_NAME,
  });
  return `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT_NUMBER}-compact2.png?${params.toString()}`;
}

export function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let suffix = "";
  for (let i = 0; i < 8; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `SACH${suffix}`;
}
