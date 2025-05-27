const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.SPREADSHEET_ID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error' })
        };
    }

    try {
        const iso = event.queryStringParameters?.iso;
        if (!iso) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'ISO code is required' })
            };
        }

        const sheetName = `ScoreCards-${iso.toUpperCase()}`;

        // Check if the sheet exists
        const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}?key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const metadataResponse = await fetch(metadataUrl);
        
        if (!metadataResponse.ok) {
            throw new Error(`Error fetching spreadsheet metadata: ${metadataResponse.status}`);
        }

        const metadata = await metadataResponse.json();
        const sheetExists = metadata.sheets.some(sheet => sheet.properties.title === sheetName);

        if (!sheetExists) {
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    rows: [],
                    message: `No data available for ${iso}`
                })
            };
        }

        // Fetch sheet data
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/${sheetName}!A2:C1000?key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                rows: data.values || []
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch scorecard data',
                details: error.message,
                sheet: `ScoreCards-${event.queryStringParameters?.iso?.toUpperCase()}`
            })
        };
    }
}; 