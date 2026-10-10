import { NextResponse } from 'next/server';
import { getExternalSpreadsheet } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function PUT(request: Request, { params }: { params: { id: string; tabId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, tabId } = await params;
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const doc = await getExternalSpreadsheet(id);
    const sheet = doc.sheetsById[Number(tabId)];

    if (!sheet) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    await sheet.updateProperties({ title });

    return NextResponse.json({ message: 'Tab updated' }, { status: 200 });
  } catch (error: any) {
    console.error('Update tab error:', error);
    return NextResponse.json({ error: 'Failed to update tab' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; tabId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, tabId } = await params;

    const doc = await getExternalSpreadsheet(id);
    const sheet = doc.sheetsById[Number(tabId)];

    if (!sheet) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    await sheet.delete();

    return NextResponse.json({ message: 'Tab deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete tab error:', error);
    return NextResponse.json({ error: 'Failed to delete tab' }, { status: 500 });
  }
}
