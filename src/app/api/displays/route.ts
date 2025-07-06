import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, clientId } = body;

    if (!name || !clientId) {
      return NextResponse.json(
        { error: 'Name and clientId are required' },
        { status: 400 }
      );
    }

    const display = await database.createDisplay({
      name,
      clientId,
      mediaItems: []
    });

    return NextResponse.json(display, { status: 201 });
  } catch (error) {
    console.error('Error creating display:', error);
    return NextResponse.json(
      { error: 'Failed to create display' },
      { status: 500 }
    );
  }
} 