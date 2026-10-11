import { NextResponse } from 'next/server';
import { getExternalSpreadsheet } from '@/lib/google-sheets';

export async function GET(request: Request, { params }: { params: Promise<{ id: string; tabId: string }> }) {
  try {
    const { id, tabId } = await params;
    const doc = await getExternalSpreadsheet(id);
    const sheet = doc.sheetsById[Number(tabId)];
    
    if (!sheet) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const rows = await sheet.getRows();
    const headers = sheet.headerValues;

    // Parse Schema (rows 0-5)
    const schema = headers.map(header => {
      const type = rows[0]?.get(header);
      const min = rows[1]?.get(header);
      const max = rows[2]?.get(header);
      const required = rows[3]?.get(header) === 'true';
      const options = rows[4]?.get(header);
      const defaultValue = rows[5]?.get(header);
      return { name: header, type, min, max, required, options, defaultValue };
    });

    return NextResponse.json({ title: sheet.title, schema }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch form schema error:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; tabId: string }> }) {
  try {
    const { id, tabId } = await params;
    const body = await request.json();

    const doc = await getExternalSpreadsheet(id);
    const sheet = doc.sheetsById[Number(tabId)];

    if (!sheet) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!body.id) {
      body.id = crypto.randomUUID();
    }

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    const lastRowIndex = rows.length > 0 ? rows[rows.length - 1].rowNumber : 1;
    const nextRowIndex = lastRowIndex;

    if (nextRowIndex >= sheet.rowCount) {
      await sheet.resize({ rowCount: sheet.rowCount + 10, columnCount: sheet.columnCount });
    }

    await sheet.loadCells({
      startRowIndex: nextRowIndex,
      endRowIndex: nextRowIndex + 1,
      startColumnIndex: 0,
      endColumnIndex: sheet.headerValues.length
    });

    sheet.headerValues.forEach((header, colIndex) => {
      const cell = sheet.getCell(nextRowIndex, colIndex);
      cell.value = body[header] || '';
    });

    await sheet.saveUpdatedCells();

    return NextResponse.json({ message: 'Form submitted successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Submit form error:', error);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
