import mammoth from "mammoth";
import JSZip from "jszip";
import type { FileType } from "@/app/generated/prisma/client";

// Import the lib file directly, not the package root: pdf-parse's index.js
// runs debug code on require that tries to read a bundled sample PDF from a
// path relative to CWD and throws ENOENT in consumer projects.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  buf: Buffer,
) => Promise<{ text: string }>;

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 600);
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  let text = "";
  for (const name of slideFiles.slice(0, 6)) {
    const xml = await zip.files[name].async("text");
    const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g) ?? [];
    text += matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ") + " ";
    if (text.length > 1200) break;
  }
  return text;
}

export async function extractExcerpt(buffer: Buffer, fileType: FileType): Promise<string> {
  try {
    if (fileType === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      return clean(result.value);
    }
    if (fileType === "pdf") {
      const result = await pdfParse(buffer);
      return clean(result.text);
    }
    if (fileType === "pptx") {
      return clean(await extractPptxText(buffer));
    }
  } catch {
    return "";
  }
  return "";
}
