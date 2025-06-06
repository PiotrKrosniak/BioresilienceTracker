const { google } = require('googleapis');

// Helper: Extract URLs from plain text
function extractUrls(text) {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return [...text.matchAll(urlRegex)].map(match => match[0]);
}

// Optional: Convert Google backgroundColor object to color name (simple version)
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

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Verify if sheet exists
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });

        const sheetExists = metadata.data.sheets.some(sheet => sheet.properties.title === sheetName);

        if (!sheetExists) {
            return {
                statusCode: 200,
                body: JSON.stringify({ rows: [], message: `No data available for ${iso}` })
            };
        }

        // Fetch full grid data
        const result = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            ranges: [`${sheetName}!A2:C1000`],
            includeGridData: true,
        });

        const rows = [];
        const rowData = result.data.sheets[0].data[0].rowData || [];

        rowData.forEach(row => {
            const values = row.values || [];

            const idCell = values[0] || {};
            const labelCell = values[1] || {};
            const urlCell = values[2] || {};

            const id = idCell.formattedValue || null;
            const label = labelCell.formattedValue || null;

            // Aggregate URLs from all possible sources
            const text = urlCell.formattedValue || '';

            const urlsFromText = extractUrls(text);

            const richLinks = (urlCell.textFormatRuns || [])
                .map(run => run.format?.link?.uri)
                .filter(link => !!link);

            const cellLevelLink = urlCell.hyperlink ? [urlCell.hyperlink] : [];

            // Also handle possible formula hyperlink (rare case)
            let formulaLink = [];
            if (urlCell.userEnteredValue?.formulaValue?.startsWith('=HYPERLINK(')) {
                const match = urlCell.userEnteredValue.formulaValue.match(/=HYPERLINK\("([^"]+)"/);
                if (match) {
                    formulaLink = [match[1]];
                }
            }

            const allUrls = [...new Set([...urlsFromText, ...richLinks, ...cellLevelLink, ...formulaLink])];

            // Handle background color (on ID cell)
            const backgroundColor = idCell.userEnteredFormat?.backgroundColor || null;
            const backgroundName = colorToName(backgroundColor);

            rows.push({
                id,
                label,
                urls: allUrls,
                backgroundColor: backgroundName
            });
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
