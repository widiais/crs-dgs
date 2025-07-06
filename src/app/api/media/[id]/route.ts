import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const media = await database.getMediaById(params.id);
    
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updatedMedia = await database.updateMedia(params.id, body);
    
    if (!updatedMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(updatedMedia);
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, duration } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Valid name is required' }, { status: 400 });
    }

    if (!duration || typeof duration !== 'number' || duration < 1 || duration > 300) {
      return NextResponse.json({ error: 'Duration must be between 1 and 300 seconds' }, { status: 400 });
    }

    // Get current media
    const currentMedia = await database.getMediaById(params.id);
    if (!currentMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Update only name and duration
    const updatedMedia = await database.updateMedia(params.id, {
      ...currentMedia,
      name: name.trim(),
      duration: duration
    });

    return NextResponse.json(updatedMedia);
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await database.deleteMedia(params.id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
} 