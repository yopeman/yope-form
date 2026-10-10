import { NextResponse } from 'next/server';
import { getUserSheet } from '@/lib/google-sheets';
import { verifyPassword } from '@/lib/hash';
import { loginSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sheet = await getUserSheet();
    const rows = await sheet.getRows();

    const user = rows.find((row: any) => row.get('email') === email);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await verifyPassword(password, user.get('password_hash'));

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const userData = {
      uuid: user.get('uuid'),
      username: user.get('username'),
      email: user.get('email')
    };

    await loginSession(userData);

    return NextResponse.json({ 
      message: 'Login successful',
      user: userData
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
