const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const iso2 = event.queryStringParameters?.iso;
    
    if (!iso2) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ISO2 code is required' })
        };
    }

    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.SPREADSHEET_ID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error' })
        };
    }

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/AnimalOutbreakTracker!A1:F1000?key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data && data.values) {
            const countryRows = data.values.filter(row => row[2] === iso2);
            
            if (countryRows.length > 0) {
                const outbreaks = countryRows.map(row => ({
                    date: row[0] || '-',
                    disease: row[3] || '-',
                    numberOfLocations: row[4] || '-',
                    reportDate: row[5] || '-'
                }));
                
                return {
                    statusCode: 200,
                    body: JSON.stringify({ outbreaks })
                };
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(null)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data' })
        };
    }
}; 