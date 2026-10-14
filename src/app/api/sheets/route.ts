import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getUserSheetsTab, getExternalSpreadsheet } from '@/lib/google-sheets';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sheet = await getUserSheetsTab();
    const rows = await sheet.getRows();

    const userRows = rows.filter((row: any) => row.get('user_id') === session.user.uuid);

    const userSheets = await Promise.all(
      userRows.map(async (row: any) => {
        const uuid = row.get('uuid');
        const sheet_id = row.get('sheet_id');
        let sheet_name = row.get('sheet_name') || 'Untitled Spreadsheet';

        try {
          const doc = await getExternalSpreadsheet(sheet_id);
          if (doc.title) {
            sheet_name = doc.title;
          }
        } catch {
          // Fall back to recorded sheet_name if live fetch fails
        }

        return {
          uuid,
          sheet_id,
          sheet_name,
          title: sheet_name,
        };
      })
    );

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

    const { sheet_id } = await request.json();

    if (!sheet_id || typeof sheet_id !== 'string' || !sheet_id.trim()) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    let cleanSheetId = sheet_id.trim();
    const urlMatch = cleanSheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanSheetId = urlMatch[1];
    }

    // Retrieve the spreadsheet to verify access and obtain the real title
    let sheet_name = 'Untitled Spreadsheet';
    try {
      const doc = await getExternalSpreadsheet(cleanSheetId);
      sheet_name = doc.title || 'Untitled Spreadsheet';
    } catch (sheetError: any) {
      console.error('Failed to access spreadsheet:', sheetError);
      return NextResponse.json({
        error: 'Failed to access spreadsheet. Please verify the Spreadsheet ID and ensure Editor access is granted to the service account.'
      }, { status: 400 });
    }

    const sheet = await getUserSheetsTab();
    const uuid = uuidv4();

    await sheet.addRow({
      uuid,
      user_id: session.user.uuid,
      sheet_id: cleanSheetId,
      sheet_name,
    });

    return NextResponse.json({ 
      message: 'Sheet connected successfully',
      sheet: { uuid, sheet_id: cleanSheetId, sheet_name, title: sheet_name }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Connect sheet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
