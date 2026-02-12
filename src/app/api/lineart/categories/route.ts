import { NextResponse } from 'next/server';

import { getLineartManifest } from '@/shared/lib/lineart';

export async function GET() {
  try {
    const { categories } = await getLineartManifest();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Failed to read lineart categories:', error);
    return NextResponse.json(
      { message: 'Failed to load lineart categories' },
      { status: 500 }
    );
  }
}
