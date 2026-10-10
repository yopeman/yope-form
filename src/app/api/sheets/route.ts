import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getUserSheetsTab } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sheet = await getUserSheetsTab();
    const rows = await sheet.getRows();

    const userSheets = rows
      .filter((row: any) => row.get('user_id') === session.user.uuid)
      .map((row: any) => ({
        uuid: row.get('uuid'),
        sheet_id: row.get('sheet_id'),
        sheet_name: row.get('sheet_name'),
      }));

    return NextResponse.json({ sheets: userSheets }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch sheets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sheet_id, sheet_name } = await request.json();

    if (!sheet_id || !sheet_name) {
      return NextResponse.json({ error: 'Missing sheet details' }, { status: 400 });
    }

    const sheet = await getUserSheetsTab();
    const uuid = uuidv4();

    await sheet.addRow({
      uuid,
      user_id: session.user.uuid,
      sheet_id,
      sheet_name,
    });

    return NextResponse.json({ 
      message: 'Sheet connected successfully',
      sheet: { uuid, sheet_id, sheet_name }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Connect sheet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
