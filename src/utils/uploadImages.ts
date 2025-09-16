import { Request } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const ENV_API_BASE = process.env.API_BASE_URL?.replace(/\/+$/, "");

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function getUploadsDir(): string {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  ensureDir(uploadDir);
  return uploadDir;
}

export function getApiBase(req: Request): string {
  if (ENV_API_BASE) return ENV_API_BASE;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = req.get("host");
  return `${proto}://${host}`;
}

export function parseProductData(req: Request) {
  const raw = (req.body?.productData ?? req.body?.product ?? req.body?.data) as
    | string
    | undefined;

  if (!raw) {
    throw new Error(
      "Missing productData. Ensure FormData includes a 'productData' JSON string."
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON in productData.");
  }
}

export function isApiHosted(url: unknown, apiBase: string): boolean {
  return typeof url === "string" && url.startsWith(`${apiBase}/uploads/`);
}

export function saveUploadedFileAndReturnUrl(
  file: Express.Multer.File,
  apiBase: string
): string {
  const uploadsDir = getUploadsDir();

  // keep extension; fallback to .webp
  const ext =
    path.extname(file.originalname || "") ||
    path.extname(file.filename || "") ||
    ".webp";

  const filename = `product_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}${ext}`;

  const absPath = path.join(uploadsDir, filename);

  if (!file.buffer) {
    throw new Error(
      "Expected file.buffer. Ensure multer.memoryStorage() is configured."
    );
  }
  fs.writeFileSync(absPath, file.buffer);

  return `${apiBase}/uploads/products/${filename}`;
}

/**
 * Merge uploaded files into:
 *  - payload.images (product-level)
 *  - payload.dimensions[*].conditions[*].images (condition-level)
 * Keeps ONLY API-hosted URLs that already exist; drops others.
 */
export function mergeFilesIntoPayload(
  payload: any,
  files: Express.Multer.File[],
  apiBase: string
) {
  if (!Array.isArray(payload.images)) payload.images = [];
  if (!Array.isArray(payload.dimensions)) payload.dimensions = [];

  // Product-level images
  const productFiles = files.filter((f) => f.fieldname === "productImages");
  const productSavedUrls = productFiles.map((f) =>
    saveUploadedFileAndReturnUrl(f, apiBase)
  );
  const keepProductUrls = payload.images.filter((u: unknown) =>
    isApiHosted(u, apiBase)
  );
  payload.images = [...keepProductUrls, ...productSavedUrls];

  // Condition-level images: conditionImages_{di}_{ci}
  const conditionFiles = files.filter((f) =>
    /^conditionImages_\d+_\d+$/.test(f.fieldname)
  );

  for (const f of conditionFiles) {
    const m = f.fieldname.match(/^conditionImages_(\d+)_(\d+)$/);
    if (!m) continue;
    const di = Number(m[1]);
    const ci = Number(m[2]);

    if (!payload.dimensions[di]) payload.dimensions[di] = {};
    if (!Array.isArray(payload.dimensions[di].conditions)) {
      payload.dimensions[di].conditions = [];
    }
    if (!payload.dimensions[di].conditions[ci]) {
      payload.dimensions[di].conditions[ci] = {};
    }
    if (!Array.isArray(payload.dimensions[di].conditions[ci].images)) {
      payload.dimensions[di].conditions[ci].images = [];
    }

    const kept = payload.dimensions[di].conditions[ci].images.filter(
      (u: unknown) => isApiHosted(u, apiBase)
    );

    const savedUrl = saveUploadedFileAndReturnUrl(f, apiBase);
    payload.dimensions[di].conditions[ci].images = [...kept, savedUrl];
  }

  return payload;
}
