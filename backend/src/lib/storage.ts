/**
 * Local filesystem storage for Mike document management.
 *
 * Files are stored under LOCAL_STORAGE_DIR, or backend/data/storage by default.
 * The storage key helpers intentionally keep the old object-key shape so the
 * rest of the app can keep treating paths as stable document references.
 */

import fs from "fs/promises";
import path from "path";
import { buildDownloadUrl } from "./downloadTokens";

function storageRoot(): string {
  return path.resolve(
    process.env.LOCAL_STORAGE_DIR ?? path.join(process.cwd(), "data", "storage"),
  );
}

function resolveStoragePath(key: string): string {
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  const root = storageRoot();
  const fullPath = path.resolve(root, normalized);
  if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
  return fullPath;
}

export const storageEnabled = true;

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export async function uploadFile(
  key: string,
  content: ArrayBuffer,
  _contentType: string,
): Promise<void> {
  const fullPath = resolveStoragePath(key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, Buffer.from(content));
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

export async function downloadFile(key: string): Promise<ArrayBuffer | null> {
  try {
    const bytes = await fs.readFile(resolveStoragePath(key));
    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteFile(key: string): Promise<void> {
  try {
    await fs.unlink(resolveStoragePath(key));
  } catch {
    // Missing local files are treated like already-deleted object keys.
  }
}

// ---------------------------------------------------------------------------
// Download URL
// ---------------------------------------------------------------------------

export async function getSignedUrl(
  key: string,
  _expiresIn = 3600,
  downloadFilename?: string,
): Promise<string | null> {
  const base =
    process.env.PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3001}`;
  return `${base}${buildDownloadUrl(key, downloadFilename ?? path.basename(key))}`;
}

export function normalizeDownloadFilename(name: string): string {
  const trimmed = name.trim();
  const base = trimmed || "download";
  return base.replace(/[\x00-\x1F\x7F]/g, "_").replace(/[\\/]/g, "_");
}

export function sanitizeDispositionFilename(name: string): string {
  return normalizeDownloadFilename(name).replace(/["\\]/g, "_");
}

export function encodeRFC5987(str: string): string {
  return encodeURIComponent(str).replace(
    /['()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

export function buildContentDisposition(
  kind: "inline" | "attachment",
  filename: string,
): string {
  const normalized = normalizeDownloadFilename(filename);
  return `${kind}; filename="${sanitizeDispositionFilename(normalized)}"; filename*=UTF-8''${encodeRFC5987(normalized)}`;
}

// ---------------------------------------------------------------------------
// Storage key helpers
// ---------------------------------------------------------------------------

export function storageKey(
  userId: string,
  docId: string,
  filename: string,
): string {
  return `documents/${userId}/${docId}/source${storageExtension(filename, ".bin")}`;
}

export function pdfStorageKey(
  userId: string,
  docId: string,
  stem: string,
): string {
  return `documents/${userId}/${docId}/${stem}.pdf`;
}

export function generatedDocKey(
  userId: string,
  docId: string,
  filename: string,
): string {
  return `generated/${userId}/${docId}/generated${storageExtension(filename, ".docx")}`;
}

export function versionStorageKey(
  userId: string,
  docId: string,
  versionSlug: string,
  filename: string,
): string {
  return `documents/${userId}/${docId}/versions/${versionSlug}${storageExtension(filename, ".bin")}`;
}

function storageExtension(filename: string, fallback: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot < 0) return fallback;
  const ext = filename.slice(lastDot).toLowerCase();
  return /^\.[a-z0-9]{1,16}$/.test(ext) ? ext : fallback;
}
