import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/database';

export async function GET() {
  try {
    const media = await database.getMedia();
    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, type, category, duration } = body;

    if (!name || !url || !type || !category || !duration) {
      return NextResponse.json({ 
        error: 'Name, url, type, category, and duration are required' 
      }, { status: 400 });
    }

    const newMedia = await database.createMedia({
      name,
      url,
      type,
      category,
      duration: parseInt(duration)
    });

    return NextResponse.json(newMedia, { status: 201 });
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
  }
} 