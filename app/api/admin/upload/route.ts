import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ensureBuckets, uploadCoverImage, uploadEbookFile } from "@/lib/storage";
import { extractExcerpt } from "@/lib/extract-text";
import { generateCover } from "@/lib/cover";
import { randomSuffix, slugify } from "@/lib/slug";
import type { FileType } from "@/app/generated/prisma/client";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const EXT_TO_TYPE: Record<string, FileType> = {
  pdf: "pdf",
  docx: "docx",
  pptx: "pptx",
};

const CONTENT_TYPE: Record<FileType, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fileType = EXT_TO_TYPE[ext];
  if (!fileType) {
    return NextResponse.json({ error: "Chỉ hỗ trợ file .pdf, .docx, .pptx" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File vượt quá 50MB" }, { status: 400 });
  }

  const titleInput = String(form.get("title") ?? "").trim();
  const descriptionInput = String(form.get("description") ?? "").trim();
  const priceInput = String(form.get("price") ?? "0").trim();
  const price = Number.isFinite(Number(priceInput)) ? Number(priceInput) : 0;

  const title = titleInput || file.name.replace(/\.[^.]+$/, "");
  const slug = `${slugify(title)}-${randomSuffix()}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const description = descriptionInput || (await extractExcerpt(buffer, fileType));

  await ensureBuckets();

  const fileKey = `${slug}.${ext}`;
  await uploadEbookFile(fileKey, buffer, CONTENT_TYPE[fileType]);

  const coverBuffer = await generateCover(title);
  const coverUrl = await uploadCoverImage(`${slug}.png`, coverBuffer, "image/png");

  const ebook = await prisma.ebook.create({
    data: {
      slug,
      title,
      description: description || null,
      fileType,
      fileKey,
      fileSizeBytes: file.size,
      coverUrl,
      price,
    },
  });

  return NextResponse.json({ ok: true, ebook });
}
