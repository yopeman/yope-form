import { NextResponse } from 'next/server';
import { getExternalSpreadsheet } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: { id: string; tabId: string } }) {
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

    const rows = await sheet.getRows();
    const headers = sheet.headerValues;

    // Parse Schema (rows 0-5)
    // row 6 is separator
    const schema = headers.map(header => {
      const type = rows[0]?.get(header);
      const min = rows[1]?.get(header);
      const max = rows[2]?.get(header);
      const required = rows[3]?.get(header) === 'true';
      const options = rows[4]?.get(header);
      const defaultValue = rows[5]?.get(header);
      return { name: header, type, min, max, required, options, defaultValue };
    });

    // Records start from row 7 (index 7 if 0-based in getRows)
    const recordRows = rows.slice(7);
    const records = recordRows.map(row => {
      const record: any = {};
      headers.forEach(header => {
        record[header] = row.get(header) || '';
      });
      // Also return the rowIndex to help with updating/deleting if needed, though we rely on `id`
      return record;
    });

    return NextResponse.json({ title: sheet.title, schema, records }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch records error:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string; tabId: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, tabId } = await params;
    const body = await request.json(); // the record data

    const doc = await getExternalSpreadsheet(id);
    const sheet = doc.sheetsById[Number(tabId)];

    if (!sheet) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    // Assign a UUID for the id field if not provided (should be provided or we generate it)
    if (!body.id) {
      body.id = crypto.randomUUID();
    }

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    // Find the absolute last row with data
    const lastRowIndex = rows.length > 0 ? rows[rows.length - 1].rowNumber : 1;
    // lastRowIndex (1-based) happens to perfectly match the 0-based index for the next empty row!
    const nextRowIndex = lastRowIndex;

    // Ensure the sheet has enough rows in its grid
    if (nextRowIndex >= sheet.rowCount) {
      // expand grid by 10 rows just to be safe
      await sheet.resize({ rowCount: sheet.rowCount + 10, columnCount: sheet.columnCount });
    }

    // Load specifically the next empty row
    await sheet.loadCells({
      startRowIndex: nextRowIndex,
      endRowIndex: nextRowIndex + 1,
      startColumnIndex: 0,
      endColumnIndex: sheet.headerValues.length
    });

    // Write values manually to avoid API gap-filling quirks
    sheet.headerValues.forEach((header, colIndex) => {
      const cell = sheet.getCell(nextRowIndex, colIndex);
      cell.value = body[header] || '';
    });

    await sheet.saveUpdatedCells();

    return NextResponse.json({ message: 'Record added', record: body }, { status: 201 });
  } catch (error: any) {
    console.error('Add record error:', error);
    return NextResponse.json({ error: 'Failed to add record' }, { status: 500 });
  }
}
