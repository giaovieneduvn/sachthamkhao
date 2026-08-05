import type { FileType } from "@/app/generated/prisma/client";

export const EXT_TO_TYPE: Record<string, FileType> = {
  pdf: "pdf",
  docx: "docx",
  pptx: "pptx",
};

export const CONTENT_TYPE: Record<FileType, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
