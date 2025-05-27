const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.SPREADSHEET_ID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error' })
        };
    }

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/GlobalNewsArticles!A1:G1000?key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch news data',
                details: error.message
            })
        };
    }
}; 