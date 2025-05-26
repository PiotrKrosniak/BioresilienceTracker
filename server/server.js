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
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

// Google Sheets API endpoint
app.get('/api/news', async (req, res) => {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/GlobalNewsArticles!A1:G1000?key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news data' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 