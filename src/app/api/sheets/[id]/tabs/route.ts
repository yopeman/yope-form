import { NextResponse } from 'next/server';
import { getExternalSpreadsheet } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params if using newer Next.js versions but since we are on Next.js 14, params is directly available. Actually, Next 15 requires awaiting params. I will await it just in case or use it directly depending on the version. Let's use `const { id } = await params;` to be safe if it's next 15. The package.json says "next": "16.4.0" (which is actually likely Next 15+).
    // Wait, let's just use `params.id` for now, or `const { id } = await params;`. Next 15+ needs await. Let's await it.
    const { id } = await params;

    const doc = await getExternalSpreadsheet(id);
    const tabs = doc.sheetsByIndex.map(sheet => ({
      sheetId: sheet.sheetId,
      title: sheet.title,
      index: sheet.index,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
    }));

    return NextResponse.json({ title: doc.title, tabs }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch tabs error:', error);
    return NextResponse.json({ error: 'Failed to fetch spreadsheet tabs. Ensure the service account has access.' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, fields } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Sheet title is required' }, { status: 400 });
    }
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'Fields are required to define the schema' }, { status: 400 });
    }

    const doc = await getExternalSpreadsheet(id);
    const headerValues = fields.map((f: any) => f.name);
    
    const newSheet = await doc.addSheet({ title, headerValues });

    const typeRow: any = {};
    const minRow: any = {};
    const maxRow: any = {};
    const reqRow: any = {};
    const optRow: any = {};
    const defRow: any = {};
    const sepRow: any = {};

    fields.forEach((f: any) => {
      typeRow[f.name] = f.type;
      minRow[f.name] = f.min || '';
      maxRow[f.name] = f.max || '';
      reqRow[f.name] = f.required ? 'true' : 'false';
      optRow[f.name] = f.options || '';
      defRow[f.name] = f.defaultValue || '';
      sepRow[f.name] = '---';
    });

    await newSheet.addRows([typeRow, minRow, maxRow, reqRow, optRow, defRow, sepRow]);

    return NextResponse.json({ 
      message: 'Tab created successfully',
      tab: {
        sheetId: newSheet.sheetId,
        title: newSheet.title,
        index: newSheet.index,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create tab error:', error);
    return NextResponse.json({ error: 'Failed to create tab' }, { status: 500 });
  }
}
