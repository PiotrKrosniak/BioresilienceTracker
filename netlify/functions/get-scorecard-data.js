const { google } = require('googleapis');


// Convert Google Sheets backgroundColor to HEX
function backgroundColorToHex(color) {
  if (!color) return null;
  const r = Math.round((color.red || 0) * 255);
  const g = Math.round((color.green || 0) * 255);
  const b = Math.round((color.blue || 0) * 255);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
}

// Extract full text with links converted to HTML
function convertTextWithLinks(text, textFormatRuns = [], hyperlinkUrl = null) {
  const segments = [];

  // If we have a hyperlink formula but no textFormatRuns, create a single link
  if (hyperlinkUrl && textFormatRuns.length === 0) {
    return `<a href="${hyperlinkUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
  }

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
      ranges: [`${sheetName}!A2:D100`],
      includeGridData: true,
      fields: 'sheets(data(rowData.values(userEnteredValue,formattedValue,textFormatRuns,hyperlink,userEnteredFormat.backgroundColor)))'
    });

    const rowData = result.data.sheets[0].data[0].rowData || [];
    


    const rows = rowData.map(row => {
      const values = row.values || [];

      console.log('Column D raw value:', JSON.stringify(values[3], null, 2));


      const id = values[0]?.formattedValue || null;
      const label = values[1]?.formattedValue || null;

      const urlCell = values[2] || {};
      const text = urlCell.formattedValue || '';
      const textFormatRuns = urlCell.textFormatRuns || [];
      const dColumn = values[3] || {};
      const dText = dColumn.formattedValue || '';
      const dTextFormatRuns = dColumn.textFormatRuns || [];
      const dHyperlinkUrl = dColumn.hyperlink?.uri || null;
      const dHtml = convertTextWithLinks(dText, dTextFormatRuns, dHyperlinkUrl);
     

      
      // Check for HYPERLINK formula
      let hyperlinkUrl = null;
      const formula = urlCell.userEnteredValue?.formulaValue;
      if (formula) {
        const match = formula.match(/=HYPERLINK\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/);
        if (match) {
          hyperlinkUrl = match[1];
          // If no text is present, use the label from the formula
          if (!text) {
            text = match[2];
          }
        }
      }

      const html = convertTextWithLinks(text, textFormatRuns, hyperlinkUrl);
      const bgColorObj = values[2]?.userEnteredFormat?.backgroundColor || null;
      const colorHex = backgroundColorToHex(bgColorObj);


      return { id, label, text, html, color: colorHex ,dHtml};
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
