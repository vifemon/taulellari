import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MIME_EXTENSIONS = new Map([
  ["image/avif", "avif"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function savePublicationPhotos(files: File[]) {
  const storageDir = getStorageDir();
  const dateSegment = new Date().toISOString().slice(0, 10);
  const targetDir = path.join(/*turbopackIgnore: true*/ storageDir, dateSegment);

  await mkdir(targetDir, { recursive: true });

  const savedPaths: string[] = [];

  for (const file of files) {
    const extension = MIME_EXTENSIONS.get(file.type) ?? "bin";
    const filename = `${randomUUID()}.${extension}`;
    const absolutePath = path.join(/*turbopackIgnore: true*/ targetDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(absolutePath, buffer, { flag: "wx" });
    savedPaths.push(absolutePath);
  }

  return savedPaths;
}

function getStorageDir() {
  const configuredDir = process.env.PHOTO_STORAGE_DIR;

  if (!configuredDir) {
    return path.join(process.cwd(), "uploads");
  }

  if (!path.isAbsolute(configuredDir)) {
    throw new Error("PHOTO_STORAGE_DIR must be an absolute path when configured");
  }

  return configuredDir;
}

export async function removeSavedPhotos(paths: string[]) {
  await Promise.all(
    paths.map(async (filePath) => {
      try {
        await unlink(filePath);
      } catch {
        // Best effort cleanup if database insertion fails after writing files.
      }
    }),
  );
}
