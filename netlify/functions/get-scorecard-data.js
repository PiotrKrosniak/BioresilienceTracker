const { google } = require('googleapis');

exports.handler = async function(event, context) {
    try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SPREADSHEET_ID) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        const iso = event.queryStringParameters?.iso;
        if (!iso) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'ISO code is required' })
            };
        }

        const sheetName = `ScoreCards-${iso.toUpperCase()}`;

        // Authenticate with service account
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Check if the sheet exists
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });

        const sheetExists = metadata.data.sheets.some(sheet => sheet.properties.title === sheetName);

        if (!sheetExists) {
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    rows: [],
                    message: `No data available for ${iso}`
                })
            };
        }

        // Fetch sheet data WITH GRID DATA (full format info)
        const result = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            ranges: [`${sheetName}!A2:C1000`],
            includeGridData: true,
        });

        const rows = [];

        const rowData = result.data.sheets[0].data[0].rowData;

        rowData.forEach(row => {
            const rowCells = row.values.map(cell => {
                const text = cell.formattedValue || '';
                const link = cell.textFormatRuns?.[0]?.format?.link?.uri || null;
                const backgroundColor = cell.userEnteredFormat?.backgroundColor || null;
                return { text, link, backgroundColor };
            });

            rows.push(rowCells);
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ rows })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch scorecard data',
                details: error.message
            })
        };
    }
};
