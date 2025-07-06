import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: displayId } = await params;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId parameter is required' },
        { status: 400 }
      );
    }

    const display = await database.getDisplayById(clientId, displayId);
    
    if (!display) {
      return NextResponse.json(
        { error: 'Display not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(display);
  } catch (error) {
    console.error('Error fetching display:', error);
    return NextResponse.json(
      { error: 'Failed to fetch display' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: displayId } = await params;
    const body = await request.json();
    const { clientId, ...updates } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const updatedDisplay = await database.updateDisplay(clientId, displayId, updates);
    
    if (!updatedDisplay) {
      return NextResponse.json(
        { error: 'Display not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedDisplay);
  } catch (error) {
    console.error('Error updating display:', error);
    return NextResponse.json(
      { error: 'Failed to update display' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: displayId } = await params;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId parameter is required' },
        { status: 400 }
      );
    }

    const success = await database.deleteDisplay(clientId, displayId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete display' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Display deleted successfully' });
  } catch (error) {
    console.error('Error deleting display:', error);
    return NextResponse.json(
      { error: 'Failed to delete display' },
      { status: 500 }
    );
  }
}

// Media assignment endpoints
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: displayId } = await params;
    const body = await request.json();
    const { clientId, action, mediaId } = body;

    if (!clientId || !action || !mediaId) {
      return NextResponse.json(
        { error: 'clientId, action, and mediaId are required' },
        { status: 400 }
      );
    }

    let success = false;
    
    if (action === 'assign') {
      success = await database.assignMediaToDisplay(clientId, displayId, mediaId);
    } else if (action === 'remove') {
      success = await database.removeMediaFromDisplay(clientId, displayId, mediaId);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "assign" or "remove"' },
        { status: 400 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${action} media` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: `Media ${action === 'assign' ? 'assigned to' : 'removed from'} display successfully` 
    });
  } catch (error) {
    console.error('Error managing media assignment:', error);
    return NextResponse.json(
      { error: 'Failed to manage media assignment' },
      { status: 500 }
    );
  }
} 