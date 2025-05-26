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

// Google Sheets API endpoint
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

// Country data endpoint
app.get('/api/country-data', async (req, res) => {
    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.SPREADSHEET_ID) {
        console.error('Required environment variables are not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const countryName = req.query.country;
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/Sheet1!A1:Z1000?key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.values) {
            // Skip header row
            const rows = data.values.slice(1);
            const countryRow = rows.find(row => row[0] === countryName);
            if (countryRow) {
                return res.json({
                    countryIso3: countryRow[1] || '-',
                    governmentPortal: countryRow[2] || '-',
                    keywords: countryRow[3] || '-'
                });
            }
        }
        res.json(null);
    } catch (error) {
        console.error('Error fetching country data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch country data',
            details: error.message 
        });
    }
});

// News data endpoint
app.get('/api/news-data', async (req, res) => {
    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.SPREADSHEET_ID) {
        console.error('Required environment variables are not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const category = req.query.category;
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/ScoreCards-GBR!A1:C1000?key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.values && data.values.length > 1) {
            // Skip header row
            let rows = data.values.slice(1);
            // Filter by category if specified
            if (category) {
                rows = rows.filter(row => row[1] && row[1].toLowerCase() === category.toLowerCase());
            }
            return res.json({ rows });
        }
        res.json({ rows: [] });
    } catch (error) {
        console.error('Error fetching news data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch news data',
            details: error.message 
        });
    }
});

// Overview data endpoint
app.get('/api/overview-data', async (req, res) => {
    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.SPREADSHEET_ID) {
        console.error('Required environment variables are not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/ScoreCards-GBR!A2:C6?key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        res.json({ rows: data.values || [] });
    } catch (error) {
        console.error('Error fetching overview data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch overview data',
            details: error.message 
        });
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

        // First, try to get the sheet metadata to check if it exists
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
            console.log(`Sheet ${sheetName} does not exist. Using default GBR sheet.`);
            // If the country-specific sheet doesn't exist, use the GBR sheet as a fallback
            const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/ScoreCards-GBR!A2:C1000?key=${process.env.GOOGLE_MAPS_API_KEY}`;
            const fallbackResponse = await fetch(fallbackUrl);
            
            if (!fallbackResponse.ok) {
                const errorText = await fallbackResponse.text();
                console.error(`Error fetching fallback data: ${fallbackResponse.status}`, errorText);
                throw new Error(`Error fetching fallback data: ${fallbackResponse.status}`);
            }
            
            const fallbackData = await fallbackResponse.json();
            console.log(`Successfully fetched ${fallbackData.values?.length || 0} rows from fallback sheet`);
            return res.json({ 
                rows: fallbackData.values || [],
                isFallback: true,
                requestedCountry: iso
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
            isFallback: false,
            requestedCountry: iso
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