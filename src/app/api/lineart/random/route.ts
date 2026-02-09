import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextRequest, NextResponse } from 'next/server';

import {
  getImageMimeType,
  getLineartManifest,
  getLineartRootDir,
} from '@/shared/lib/lineart';

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category');

  if (!category) {
    return new NextResponse('Missing category parameter', { status: 400 });
  }

  try {
    const { filesByCategory } = await getLineartManifest();
    const categoryFiles = filesByCategory.get(category);

    if (!categoryFiles || categoryFiles.length === 0) {
      return new NextResponse('Category not found', { status: 404 });
    }

    const randomFile = pickRandom(categoryFiles);
    const filePath = path.join(getLineartRootDir(), category, randomFile);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': getImageMimeType(randomFile),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Failed to read random lineart image:', error);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
