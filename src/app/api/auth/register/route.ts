import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getUserSheet } from '@/lib/google-sheets';
import { hashPassword } from '@/lib/hash';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sheet = await getUserSheet();
    const rows = await sheet.getRows();

    // Check if user already exists
    const userExists = rows.some((row) => row.get('email') === email || row.get('username') === username);
    if (userExists) {
      return NextResponse.json({ error: 'User already exists with this email or username' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const uuid = uuidv4();

    await sheet.addRow({
      uuid,
      username,
      email,
      password_hash: passwordHash,
    });

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
