const { google } = require('googleapis');

// Extract URLs from rich text runs
function extractRichLinks(textFormatRuns = []) {
  return [...new Set(
    textFormatRuns
      .map(run => run.format?.link?.uri)
      .filter(Boolean)
  )];
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

    const result = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      ranges: [`${sheetName}!A2:C1000`],
      includeGridData: true,
      fields: 'sheets(data(rowData(values(userEnteredValue,formattedValue,textFormatRuns,hyperlink))))'
    });

    const rowData = result.data.sheets[0].data[0].rowData || [];

    const rows = rowData.map(row => {
      const values = row.values || [];

      const id = values[0]?.formattedValue || null;
      const label = values[1]?.formattedValue || null;

      const urlCell = values[2] || {};
      const text = urlCell.formattedValue || '';
      const richLinks = extractRichLinks(urlCell.textFormatRuns);
      const cellLink = urlCell.hyperlink ? [urlCell.hyperlink] : [];

      const urls = [...new Set([...richLinks, ...cellLink])];

      return { id, label, text, urls };
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
