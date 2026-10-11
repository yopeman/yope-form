import { NextResponse } from 'next/server';
import { getExternalSpreadsheet } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; tabId: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, tabId } = await params;
    const { title, fields } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const doc = await getExternalSpreadsheet(id);
    const sheet = doc.sheetsById[Number(tabId)];

    if (!sheet) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    await sheet.updateProperties({ title });

    if (fields && Array.isArray(fields) && fields.length > 0) {
      await sheet.setHeaderRow(fields.map((f: any) => f.name));
      const rows = await sheet.getRows();
      
      if (rows.length >= 7) {
        fields.forEach((f: any) => {
          rows[0].assign({ [f.name]: f.type });
          rows[1].assign({ [f.name]: f.min || '' });
          rows[2].assign({ [f.name]: f.max || '' });
          rows[3].assign({ [f.name]: f.required ? 'true' : 'false' });
          rows[4].assign({ [f.name]: f.options || '' });
          rows[5].assign({ [f.name]: f.defaultValue || '' });
          rows[6].assign({ [f.name]: '---' });
        });

        await Promise.all([
          rows[0].save(),
          rows[1].save(),
          rows[2].save(),
          rows[3].save(),
          rows[4].save(),
          rows[5].save(),
          rows[6].save(),
        ]);
      }
    }

    return NextResponse.json({ message: 'Tab updated' }, { status: 200 });
  } catch (error: any) {
    console.error('Update tab error:', error);
    return NextResponse.json({ error: 'Failed to update tab' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; tabId: string }> }) {
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
