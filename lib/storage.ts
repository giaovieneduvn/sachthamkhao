import { createClient } from "@supabase/supabase-js";

export const FILES_BUCKET = "ebook-files";
export const COVERS_BUCKET = "ebook-covers";

let cached: ReturnType<typeof createClient> | null = null;

function supabase() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export async function ensureBuckets() {
  const client = supabase();
  const { data: buckets } = await client.storage.listBuckets();
  const names = new Set(buckets?.map((b) => b.name));

  if (!names.has(FILES_BUCKET)) {
    await client.storage.createBucket(FILES_BUCKET, { public: false });
  }
  if (!names.has(COVERS_BUCKET)) {
    await client.storage.createBucket(COVERS_BUCKET, { public: true });
  }
}

export async function uploadEbookFile(key: string, buffer: Buffer, contentType: string) {
  const { error } = await supabase()
    .storage.from(FILES_BUCKET)
    .upload(key, buffer, { contentType, upsert: true });
  if (error) throw error;
}

export async function uploadCoverImage(key: string, buffer: Buffer, contentType: string) {
  const { error } = await supabase()
    .storage.from(COVERS_BUCKET)
    .upload(key, buffer, { contentType, upsert: true });
  if (error) throw error;
  return supabase().storage.from(COVERS_BUCKET).getPublicUrl(key).data.publicUrl;
}

// Fetches the file bytes server-side so the app can stream them back under its
// own domain — the client never sees a Supabase URL (signed or not) to copy/share.
export async function downloadEbookFile(key: string): Promise<Buffer> {
  const { data, error } = await supabase().storage.from(FILES_BUCKET).download(key);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteEbookFile(key: string) {
  await supabase().storage.from(FILES_BUCKET).remove([key]);
}
