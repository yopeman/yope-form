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

export const getExternalSpreadsheet = async (sheetId: string) => {
  const jwt = getAuthToken();
  const doc = new GoogleSpreadsheet(sheetId, jwt);
  await doc.loadInfo();
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
