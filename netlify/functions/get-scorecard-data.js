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
  // If we have a hyperlink formula but no format runs, treat whole cell as a link
  if (hyperlinkUrl && textFormatRuns.length === 0) {
    return `<a href="${hyperlinkUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
  }

  // Sort the runs to ensure correct order
  const runs = [...textFormatRuns].sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));

  // Google always includes a first run without startIndex (meaning 0). If it is missing, add a default one
  if (runs.length === 0 || (runs[0].startIndex ?? 0) !== 0) {
    runs.unshift({ startIndex: 0, format: {} });
  }

  let html = "";

  for (let i = 0; i < runs.length; i++) {
    const current = runs[i];
    const start = current.startIndex || 0;
    const end = (i + 1 < runs.length) ? runs[i + 1].startIndex : text.length;

    const rawSegment = text.slice(start, end);
    if (!rawSegment) continue;

    const { link, bold } = current.format || {};

    let segmentHtml = escapeHtml(rawSegment);

    // Apply bold if flagged
    if (bold) {
      segmentHtml = `<strong>${segmentHtml}</strong>`;
    }

    // Apply link if flagged
    if (link?.uri) {
      segmentHtml = `<a href="${link.uri}" target="_blank" rel="noopener noreferrer">${segmentHtml}</a>`;
    }

    html += segmentHtml;
  }

  return html;
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



      const id = values[0]?.formattedValue || null;
      const label = values[1]?.formattedValue || null;

      const urlCell = values[2] || {};
      const text = urlCell.formattedValue || '';
      const textFormatRuns = urlCell.textFormatRuns || [];
      const dColumn = values[3] || {};
      const dText = dColumn.formattedValue || '';
      const dTextFormatRuns = dColumn.textFormatRuns || [];
      const dHyperlinkUrl = dColumn.hyperlink?.uri || null;

      // First, convert the full cell text (including links & bold) to HTML
      const baseDHtml = convertTextWithLinks(dText, dTextFormatRuns, dHyperlinkUrl);

      // Transform bullet-point lines (• or ●) into <li> items while keeping formatting
      const bulletTransformed = baseDHtml
        .split('\n')
        .map(line => {
          const trimmed = line.trimStart();
          if (trimmed.startsWith('●') || trimmed.startsWith('•')) {
            // remove the bullet character and any following nbsp/space
            const withoutBullet = trimmed.substring(1).replace(/^\s*|&nbsp;?/,'').trimStart();
            return `<li>${withoutBullet}</li>`;
          }
          return line;
        })
        .join('');

      const dHtml = bulletTransformed.includes('<li>')
        ? `<ul>${bulletTransformed}</ul>`
        : bulletTransformed;
     

      
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


      return { id, label, text, html, color: colorHex , dText, dHyperlinkUrl, dHtml, dTextFormatRuns};
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
