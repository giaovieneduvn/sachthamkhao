import sharp from "sharp";

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#059669", "#d97706", "#dc2626", "#0891b2"];

function pickColor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = (current + " " + w).trim();
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 6);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function generateCover(title: string): Promise<Buffer> {
  const width = 600;
  const height = 800;
  const bg = pickColor(title);
  const lines = wrapText(title.toUpperCase(), 18);
  const lineHeight = 46;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

  const textNodes = lines
    .map(
      (line, i) =>
        `<text x="50%" y="${startY + i * lineHeight}" font-size="34" font-family="Arial, sans-serif" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(line)}</text>`,
    )
    .join("");

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bg}"/>
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="white" stroke-opacity="0.35" stroke-width="2"/>
    ${textNodes}
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
