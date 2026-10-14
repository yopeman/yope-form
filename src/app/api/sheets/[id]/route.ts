import { NextResponse } from 'next/server';
import { getUserSheetsTab, getExternalSpreadsheet } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { sheet_name } = await request.json();

    if (!sheet_name || typeof sheet_name !== 'string' || !sheet_name.trim()) {
      return NextResponse.json({ error: 'Sheet name is required' }, { status: 400 });
    }

    const userSheetsTab = await getUserSheetsTab();
    const rows = await userSheetsTab.getRows();
    const sheetRow = rows.find(r => r.get('uuid') === id || r.get('sheet_id') === id);

    if (!sheetRow) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    const targetSheetId = sheetRow.get('sheet_id');

    // Update the file name directly in Google Sheets
    try {
      const doc = await getExternalSpreadsheet(targetSheetId);
      await doc.updateProperties({ title: sheet_name.trim() });
    } catch (sheetError: any) {
      console.error('Failed to update Google Spreadsheet file title:', sheetError);
      return NextResponse.json({
        error: 'Failed to update Google Sheet title directly. Ensure the service account has Editor access to the sheet.'
      }, { status: 500 });
    }

    sheetRow.assign({ sheet_name: sheet_name.trim() });
    await sheetRow.save();

    return NextResponse.json({ message: 'Sheet updated successfully', title: sheet_name.trim() }, { status: 200 });
  } catch (error: any) {
    console.error('Update sheet error:', error);
    return NextResponse.json({ error: 'Failed to update sheet' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
