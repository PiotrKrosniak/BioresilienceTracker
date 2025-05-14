// newsData.js
// Fetch and display news data for different categories from Google Sheets

const NEWS_SHEET = 'ScoreCards-GBR';
const NEWS_RANGE = 'A1:C1000'; // ID, Category, Text

async function fetchNewsData(category = null) {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${NEWS_SHEET}!${NEWS_RANGE}?key=${API_KEY}`);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            // Skip header row
            const rows = data.values.slice(1);
            // Filter by category if specified
            return category ? 
                rows.filter(row => row[1] && row[1].toLowerCase() === category.toLowerCase()) :
                rows;
        }
        return [];
    } catch (error) {
        console.error('Error fetching news data:', error);
        return [];
    }
}

function renderNewsContent(rows) {
    if (!rows.length) {
        return '<div class="no-news">No news available for this category.</div>';
    }

    let html = '<div class="news-container">';
    rows.forEach(row => {
        html += `
            <div class="news-item" data-id="${row[0]}">
                <div class="news-text">${row[2]}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Function to update news for a specific category
async function updateNewsTab(category) {
    const rows = await fetchNewsData(category);
    document.getElementById('news').innerHTML = renderNewsContent(rows);
}

// Function to update all news
async function updateAllNews() {
    const rows = await fetchNewsData();
    document.getElementById('news').innerHTML = renderNewsContent(rows);
}

// Fetch and render overview data for the overview tab (rows 2-6)
const OVERVIEW_RANGE = 'A2:C6'; // Rows 2-6, columns A-C

async function fetchOverviewData() {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${NEWS_SHEET}!${OVERVIEW_RANGE}?key=${API_KEY}`);
        const data = await response.json();
        if (data.values && data.values.length) {
            return data.values;
        }
        return [];
    } catch (error) {
        console.error('Error fetching overview data:', error);
        return [];
    }
}

function renderOverviewTab(rows) {
    if (!rows.length) {
        return '<div>No overview data available.</div>';
    }
    let html = '<div class="overview-section">';
    rows.forEach(row => {
        html += `
            <div class="overview-category">
                <h4>${row[1]}</h4>
                <div class="overview-text">${row[2]}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Usage: call this when a country is selected (e.g., GBR)
async function updateOverviewTab() {
    const rows = await fetchOverviewData();
    document.getElementById('overview').innerHTML = renderOverviewTab(rows);
}

// Fetch overview rows for the selected ISO
const OVERVIEW_RANGE_ISO = 'A2:D1000'; // A: ID, B: Category, C: Text, D: ISO

async function fetchOverviewRows(iso) {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${NEWS_SHEET}!${OVERVIEW_RANGE_ISO}?key=${API_KEY}`
        );
        const data = await response.json();
        if (data.values && data.values.length) {
            // Filter rows by ISO (case-insensitive)
            return data.values.filter(row => row[3] && row[3].toUpperCase() === iso.toUpperCase());
        }
        return [];
    } catch (error) {
        console.error('Error fetching overview data:', error);
        return [];
    }
}

// Append overview rows to the overview table
async function appendOverviewRowsToTable(iso) {
    // Dynamically set the sheet name for the country
    const sheetName = `ScoreCards-${iso.toUpperCase()}`;
    const range = 'A2:C1000'; // Adjust if you have more columns/rows
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`
        );
        const data = await response.json();
        const rows = (data.values && data.values.length) ? data.values : [];
        console.log('Appending rows for sheet:', sheetName, rows); // Debug

        // Split rows into different sections
        const biosecurityExplainerRows = rows.slice(0, 5); // Rows 1-5
        const biosecurityTrackerRows = rows.slice(5, 18); // Rows 6-11
        const resourcesRows = rows.slice(19); // Row 12 onwards

        // Update biosecurityExplainer tab
        const biosecurityExplainerTable = document.querySelector('#biosecurityExplainer .info-table table');
        if (biosecurityExplainerTable) {
            Array.from(biosecurityExplainerTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            biosecurityExplainerRows.forEach(row => {
                if (!row[1] || !row[2]) return;
                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';
                const th = document.createElement('th');
                th.textContent = row[1].replace(/\n/g, ' ');
                const td = document.createElement('td');
                td.innerHTML = row[2].replace(/\n/g, '<br>');
                tr.appendChild(th);
                tr.appendChild(td);
                biosecurityExplainerTable.appendChild(tr);
            });
        }

        // Update biosecurityTracker tab
        const biosecurityTrackerTable = document.querySelector('#biosecurityTracker .info-table table');
        if (biosecurityTrackerTable) {
            Array.from(biosecurityTrackerTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            biosecurityTrackerRows.forEach(row => {
                if (!row[1] || !row[2]) return;
                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';
                const th = document.createElement('th');
                th.textContent = row[1].replace(/\n/g, ' ');
                const td = document.createElement('td');
                td.innerHTML = row[2].replace(/\n/g, '<br>');
                tr.appendChild(th);
                tr.appendChild(td);
                biosecurityTrackerTable.appendChild(tr);
            });
        }

        // Update resources tab
        const resourcesTable = document.querySelector('#resources .info-table table');
        if (resourcesTable) {
            Array.from(resourcesTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            resourcesRows.forEach(row => {
                if (!row[1] || !row[2]) return;
                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';
                const th = document.createElement('th');
                th.textContent = row[1].replace(/\n/g, ' ');
                const td = document.createElement('td');
                td.innerHTML = row[2].replace(/\n/g, '<br>');
                tr.appendChild(th);
                tr.appendChild(td);
                resourcesTable.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error fetching overview data:', error);
    }
}

// Export functions for use in other files
window.updateNewsTab = updateNewsTab;
window.updateAllNews = updateAllNews;
window.updateOverviewTab = updateOverviewTab;
window.appendOverviewRowsToTable = appendOverviewRowsToTable; 