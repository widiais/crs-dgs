import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, password, pin } = body;

    if (type === 'admin') {
      // Admin login with hardcoded credentials
      if (email === 'super@admin.com' && password === 'superadmin2025') {
        return NextResponse.json({
          user: {
            uid: 'admin-001',
            email: 'super@admin.com',
            role: 'admin'
          }
        });
      } else {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    } else if (type === 'store') {
      // Store login with PIN
      if (!pin) {
        return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
      }

      try {
        const client = await database.getClientByPin(pin);
        if (client) {
          return NextResponse.json({
            user: {
              uid: `store-${client.id}`,
              role: 'store',
              clientId: client.id,
              clientName: client.name
            }
          });
        } else {
          return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
        }
      } catch (error) {
        console.error('Error validating PIN:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid login type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
} 