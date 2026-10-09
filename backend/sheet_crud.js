import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });



export const insertData = async (data) => {
    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Mamo",
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [Object.values(data)],
            },
        });
        return response.data.updates.updatedCells;
    } catch (error) {
        console.error("Error writing to sheet:", error);
        throw error;
    }
};


export const getAllData = async () => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Sheet1",
  });
  return response.data.values;
}


insertData({name: 'mamo name', email: 'mamo email', role: 'mamo role'})
// console.log(await getAllData());
