import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const getAuthToken = () => {
  return new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
};

export const getSpreadsheet = async () => {
  const jwt = getAuthToken();
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID as string, jwt);
  await doc.loadInfo(); // loads document properties and worksheets
  return doc;
};

export const getUserSheet = async () => {
  const doc = await getSpreadsheet();
  let sheet = doc.sheetsByTitle['user'];

  if (!sheet) {
    sheet = await doc.addSheet({
      title: 'user',
      headerValues: ['uuid', 'username', 'email', 'password_hash'],
    });
  }

  return sheet;
};

export const getUserSheetsTab = async () => {
  const doc = await getSpreadsheet();
  let sheet = doc.sheetsByTitle['user_sheets'];

  if (!sheet) {
    sheet = await doc.addSheet({
      title: 'user_sheets',
      headerValues: ['uuid', 'user_id', 'sheet_id', 'sheet_name'],
    });
  }

  return sheet;
};

export const getExternalSpreadsheet = async (sheetId: string) => {
  let resolvedId = sheetId;
  if (sheetId && sheetId.length === 36 && sheetId.includes('-')) {
    try {
      const sheet = await getUserSheetsTab();
      const rows = await sheet.getRows();
      const match = rows.find((r: any) => r.get('uuid') === sheetId);
      if (match && match.get('sheet_id')) {
        resolvedId = match.get('sheet_id');
      }
    } catch (e) {
      console.warn('Could not resolve sheetId from uuid:', e);
    }
  }

  const jwt = getAuthToken();
  const doc = new GoogleSpreadsheet(resolvedId, jwt);
  await doc.loadInfo();
  return doc;
};
