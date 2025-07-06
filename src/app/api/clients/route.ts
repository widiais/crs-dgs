import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/database';

export async function GET() {
  try {
    const clients = await database.getClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, pin } = body;

    if (!name || !description || !pin) {
      return NextResponse.json({ 
        error: 'Name, description, and PIN are required' 
      }, { status: 400 });
    }

    // Validate PIN format
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json({ 
        error: 'PIN must be exactly 6 digits' 
      }, { status: 400 });
    }

    // Check if PIN already exists
    const existingClient = await database.getClientByPin(pin);
    if (existingClient) {
      return NextResponse.json({ 
        error: 'PIN already exists. Please use a different PIN.' 
      }, { status: 400 });
    }

    const newClient = await database.createClient({
      name,
      description,
      pin
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
} 