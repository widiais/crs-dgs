import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const displays = await database.getDisplaysByClientId(clientId);
    return NextResponse.json(displays);
  } catch (error) {
    console.error('Error fetching displays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch displays' },
      { status: 500 }
    );
  }
} 