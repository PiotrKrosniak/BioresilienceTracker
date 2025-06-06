const { google } = require('googleapis');

// Extract full text with links converted to HTML
function convertTextWithLinks(text, textFormatRuns = []) {
  const segments = [];

  // Sort runs by startIndex for safety
  textFormatRuns.sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));

  for (let i = 0; i < textFormatRuns.length; i++) {
    const run = textFormatRuns[i];
    const start = run.startIndex || 0;
    const end = (i + 1 < textFormatRuns.length)
      ? textFormatRuns[i + 1].startIndex
      : text.length;

    const segmentText = text.slice(start, end);
    const link = run.format?.link?.uri;

    if (link) {
      segments.push(`<a href="${link}" target="_blank" rel="noopener noreferrer">${escapeHtml(segmentText)}</a>`);
    } else {
      segments.push(escapeHtml(segmentText));
    }
  }

  return segments.join('');
}

// Simple HTML escape for safety (basic version)
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;');
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
      const textFormatRuns = urlCell.textFormatRuns || [];

      const html = convertTextWithLinks(text, textFormatRuns);

      return { id, label, text, html };
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
