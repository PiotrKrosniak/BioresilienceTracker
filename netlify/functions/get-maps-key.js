const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key not configured' })
        };
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ key: process.env.GOOGLE_MAPS_API_KEY })
    };
}; 