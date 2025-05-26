require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the parent directory
app.use(express.static('../'));

// Google Maps API endpoint
app.get('/api/maps-key', (req, res) => {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key is not set in environment variables');
        return res.status(500).json({ error: 'API key not configured' });
    }
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

// Global News Articles
app.get('/api/news', async (req, res) => {
    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.SPREADSHEET_ID) {
        console.error('Required environment variables are not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/GlobalNewsArticles!A1:G1000?key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ 
            error: 'Failed to fetch news data',
            details: error.message 
        });
    }
});

// Country Government News Data (Animal and Human)
app.get('/api/country-data', async (req, res) => {
    const iso2 = req.query.iso;
    if (!iso2) {
        return res.status(400).json({ error: 'ISO2 code is required' });
    }

    console.log(`Fetching data for ISO2 code: ${iso2}`);

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/AnimalOutbreakTracker!A1:F1000?key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data && data.values) {
            // Find all rows matching the ISO2 code in column C
            const countryRows = data.values.filter(row => row[2] === iso2);
            
            if (countryRows.length > 0) {
                // Map the rows to the expected format
                const outbreaks = countryRows.map(row => ({
                    date: row[0] || '-',
                    disease: row[3] || '-',
                    numberOfLocations: row[4] || '-',
                    reportDate: row[5] || '-'
                }));
                
                return res.json({ outbreaks });
            }
        }
        res.json(null);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});


// Scorecard data endpoint
app.get('/api/scorecard-data', async (req, res) => {
    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.SPREADSHEET_ID) {
        console.error('Required environment variables are not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const iso = req.query.iso;
        if (!iso) {
            console.error('No ISO code provided in request');
            return res.status(400).json({ error: 'ISO code is required' });
        }

        const sheetName = `ScoreCards-${iso.toUpperCase()}`;
        console.log(`Fetching data from sheet: ${sheetName}`);

        // First check if the country-specific sheet exists
        const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}?key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const metadataResponse = await fetch(metadataUrl);
        
        if (!metadataResponse.ok) {
            const errorText = await metadataResponse.text();
            console.error(`Error fetching spreadsheet metadata: ${metadataResponse.status}`, errorText);
            throw new Error(`Error fetching spreadsheet metadata: ${metadataResponse.status}`);
        }

        const metadata = await metadataResponse.json();
        const sheetExists = metadata.sheets.some(sheet => sheet.properties.title === sheetName);

        if (!sheetExists) {
            console.log(`Sheet ${sheetName} does not exist. No data available.`);
            return res.json({ 
                rows: [],
                message: `No data available for ${iso}`
            });
        }

        // If the sheet exists, fetch its data
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/${sheetName}!A2:C1000?key=${process.env.GOOGLE_MAPS_API_KEY}`;
        console.log('Requesting URL:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Google Sheets API error: ${response.status}`, errorText);
            throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        if (!data.values) {
            console.log(`No data found for sheet: ${sheetName}`);
            return res.json({ rows: [] });
        }

        console.log(`Successfully fetched ${data.values.length} rows from ${sheetName}`);
        res.json({ 
            rows: data.values,
        });
    } catch (error) {
        console.error('Error fetching scorecard data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch scorecard data',
            details: error.message,
            sheet: `ScoreCards-${req.query.iso?.toUpperCase()}`
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        details: err.message 
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment variables status:');
    console.log('- GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set');
    console.log('- SPREADSHEET_ID:', process.env.SPREADSHEET_ID ? 'Set' : 'Not set');
}); 