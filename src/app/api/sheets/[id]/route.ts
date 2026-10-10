import { NextResponse } from 'next/server';
import { getUserSheetsTab } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { sheet_name } = await request.json();

    const userSheetsTab = await getUserSheetsTab();
    const rows = await userSheetsTab.getRows();
    const sheetRow = rows.find(r => r.get('uuid') === id || r.get('sheet_id') === id);

    if (!sheetRow) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    sheetRow.assign({ sheet_name });
    await sheetRow.save();

    return NextResponse.json({ message: 'Sheet updated' }, { status: 200 });
  } catch (error: any) {
    console.error('Update sheet error:', error);
    return NextResponse.json({ error: 'Failed to update sheet' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const userSheetsTab = await getUserSheetsTab();
    const rows = await userSheetsTab.getRows();
    const sheetRow = rows.find(r => r.get('uuid') === id || r.get('sheet_id') === id);

    if (!sheetRow) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    await sheetRow.delete();

    return NextResponse.json({ message: 'Sheet deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete sheet error:', error);
    return NextResponse.json({ error: 'Failed to delete sheet' }, { status: 500 });
  }
}
