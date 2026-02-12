import 'server-only';

import path from 'node:path';
import { readdir } from 'node:fs/promises';

export type LineartCategory = {
  value: string;
  label: string;
  count: number;
};

type LineartManifest = {
  categories: LineartCategory[];
  filesByCategory: Map<string, string[]>;
};

const LINEART_ROOT_DIR = path.join(process.cwd(), 'lineart_part');
const MANIFEST_CACHE_TTL_MS = 60_000;

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
]);

let cachedManifest: LineartManifest | null = null;
let cachedAt = 0;

function isImageFile(fileName: string) {
  return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function toLabel(categoryName: string) {
  return categoryName.replace(/_/g, ' ');
}

async function buildManifest(): Promise<LineartManifest> {
  const rootEntries = await readdir(LINEART_ROOT_DIR, { withFileTypes: true });
  const categoryDirs = rootEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const filesByCategory = new Map<string, string[]>();
  const categories: LineartCategory[] = [];

  for (const categoryDir of categoryDirs) {
    const categoryPath = path.join(LINEART_ROOT_DIR, categoryDir);
    const categoryEntries = await readdir(categoryPath, { withFileTypes: true });
    const imageFiles = categoryEntries
      .filter((entry) => entry.isFile() && isImageFile(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    if (!imageFiles.length) {
      continue;
    }

    filesByCategory.set(categoryDir, imageFiles);
    categories.push({
      value: categoryDir,
      label: toLabel(categoryDir),
      count: imageFiles.length,
    });
  }

  return { categories, filesByCategory };
}

export async function getLineartManifest(
  options: { forceRefresh?: boolean } = {}
): Promise<LineartManifest> {
  const { forceRefresh = false } = options;
  const shouldUseCache =
    !forceRefresh &&
    cachedManifest &&
    Date.now() - cachedAt < MANIFEST_CACHE_TTL_MS;

  if (shouldUseCache && cachedManifest) {
    return cachedManifest;
  }

  const manifest = await buildManifest();
  cachedManifest = manifest;
  cachedAt = Date.now();

  return manifest;
}

export function getLineartRootDir() {
  return LINEART_ROOT_DIR;
}

export function getImageMimeType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.bmp') return 'image/bmp';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';

  return 'application/octet-stream';
}
