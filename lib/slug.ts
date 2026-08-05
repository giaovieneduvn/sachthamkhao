const DIACRITICS_RANGE = new RegExp("[̀-ͯ]", "g");

export function slugify(input: string): string {
  const lower = input.toLowerCase().replace(/đ/g, "d");
  const noDiacritics = lower.normalize("NFD").replace(DIACRITICS_RANGE, "");
  const slug = noDiacritics.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.slice(0, 80) || "ebook";
}

export function randomSuffix(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
