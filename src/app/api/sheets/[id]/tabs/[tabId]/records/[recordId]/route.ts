import { NextResponse } from 'next/server';
import { getExternalSpreadsheet } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function PUT(request: Request, { params }: { params: { id: string; tabId: string; recordId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, tabId, recordId } = await params;
    const updates = await request.json();

    const doc = await getExternalSpreadsheet(id);
    const sheet = doc.sheetsById[Number(tabId)];

    if (!sheet) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    const rows = await sheet.getRows();
    const recordRow = rows.find(r => r.get('id') === recordId);

    if (!recordRow) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Assign updates
    Object.keys(updates).forEach(key => {
      if (key !== 'id') { // Prevent changing the ID
        recordRow.assign({ [key]: updates[key] });
      }
    });

    await recordRow.save();

    return NextResponse.json({ message: 'Record updated' }, { status: 200 });
  } catch (error: any) {
    console.error('Update record error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; tabId: string; recordId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, tabId, recordId } = await params;

    const doc = await getExternalSpreadsheet(id);
    const sheet = doc.sheetsById[Number(tabId)];

    if (!sheet) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    const rows = await sheet.getRows();
    const recordRow = rows.find(r => r.get('id') === recordId);

    if (!recordRow) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await recordRow.delete();

    return NextResponse.json({ message: 'Record deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete record error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
