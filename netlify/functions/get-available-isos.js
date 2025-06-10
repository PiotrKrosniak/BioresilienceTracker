const { google } = require('googleapis');

exports.handler = async function (event, context) {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SPREADSHEET_ID) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const result = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      fields: 'sheets.properties.title'
    });

    // Filter sheets that start with 'ScoreCards-' and extract ISO codes
    const isos = result.data.sheets
      .map(sheet => sheet.properties.title)
      .filter(title => title.startsWith('ScoreCards-'))
      .map(title => title.replace('ScoreCards-', ''));

    return {
      statusCode: 200,
      body: JSON.stringify({ isos })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch available ISO codes',
        details: error.message
      })
    };
  }
}; 