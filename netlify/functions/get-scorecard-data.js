const { google } = require('googleapis');

// Extract URLs from plain text
function extractUrls(text) {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return [...text.matchAll(urlRegex)].map(match => match[0]);
}

// Convert Google backgroundColor to color name
function colorToName(color) {
    if (!color) return null;
    const r = Math.round((color.red || 0) * 255);
    const g = Math.round((color.green || 0) * 255);
    const b = Math.round((color.blue || 0) * 255);

    if (r === 255 && g === 255 && b === 0) return "yellow";
    if (r === 255 && g === 0 && b === 0) return "red";
    if (r === 0 && g === 255 && b === 0) return "green";
    return `rgb(${r},${g},${b})`;
}

exports.handler = async function (event, context) {
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

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1️⃣ Get text content first (values.get)
        const rawValuesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${sheetName}!A2:C1000`,
        });

        const rawValues = rawValuesResponse.data.values || [];

        // 2️⃣ Get formatting info (spreadsheets.get)
        const gridDataResponse = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            ranges: [`${sheetName}!A2:C1000`],
            includeGridData: true,
        });

        const gridDataRows = gridDataResponse.data.sheets[0].data[0].rowData || [];

        const rows = [];

        for (let i = 0; i < rawValues.length; i++) {
            const rawRow = rawValues[i];
            const gridRow = gridDataRows[i] || { values: [] };
            const gridCells = gridRow.values || [];

            const id = rawRow[0] || null;
            const label = rawRow[1] || null;
            const rawUrlText = rawRow[2] || '';

            const urlCell = gridCells[2] || {};

            // Extract links from full API
            const urlsFromText = extractUrls(rawUrlText);

            const richLinks = (urlCell.textFormatRuns || [])
                .map(run => run.format?.link?.uri)
                .filter(link => !!link);

            const cellLevelLink = urlCell.hyperlink ? [urlCell.hyperlink] : [];

            let formulaLink = [];
            if (urlCell.userEnteredValue?.formulaValue?.startsWith('=HYPERLINK(')) {
                const match = urlCell.userEnteredValue.formulaValue.match(/=HYPERLINK\("([^"]+)"/);
                if (match) {
                    formulaLink = [match[1]];
                }
            }

            const allUrls = [...new Set([...urlsFromText, ...richLinks, ...cellLevelLink, ...formulaLink])];

            const backgroundColor = (gridCells[0]?.userEnteredFormat?.backgroundColor) || null;
            const backgroundName = colorToName(backgroundColor);

            rows.push({
                id,
                label,
                urls: allUrls,
                backgroundColor: backgroundName
            });
        }

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
