// newsData.js
// Fetch and display news data for different categories from Google Sheets

const NEWS_SHEET = 'ScoreCards-GBR';
const NEWS_RANGE = 'A1:C1000'; // ID, Category, Text

async function fetchNewsData(category = null, iso = null) {
    try {
        const response = await fetch(`/.netlify/functions/get-news-data?category=${category || ''}&iso=${iso || ''}`);
        const data = await response.json();
        return data.rows || [];
    } catch (error) {
        console.error('Error fetching news data:', error);
        return [];
    }
}

function renderNewsContent(rows, message = null) {
    if (!rows.length) {
        return `<div class="no-news">${message || 'No news available for this category.'}</div>`;
    }

    let html = '<div class="news-container">';
    rows.forEach(row => {
        // For government updates (from GlobalNewsArticles sheet)
        if (row.length >= 7) { // GlobalNewsArticles format
            html += `
                <div class="news-item" data-id="${row[0]}">
                    <div class="news-title">${row[0]}</div>
                    <div class="news-description">${row[1]}</div>
                    <div class="news-source">${row[3]}</div>
                    <div class="news-date">${row[4]}</div>
                </div>
            `;
        } else { // ScoreCards format
            html += `
                <div class="news-item" data-id="${row[0]}">
                    <div class="news-text">${row[2]}</div>
                </div>
            `;
        }
    });
    html += '</div>';
    return html;
}

// Function to update news for a specific category
async function updateNewsTab(iso) {
    console.log(`Updating government news tab for country: ${iso}`);
    try {
        const response = await fetch(`/.netlify/functions/get-country-data?iso=${iso}`);
        const data = await response.json();
        
        if (data.outbreaks && data.outbreaks.length > 0) {
            let html = '<div class="info-table"><table>';
            html += '<thead><tr>' +
                '<th>Date</th>' +
                '<th>Disease</th>' +
                '<th>Number of Locations</th>' +
                '<th>Report Date</th>' +
                '</tr></thead><tbody>';
            
            data.outbreaks.forEach(outbreak => {
                html += `<tr>
                    <td>${outbreak.date}</td>
                    <td>${outbreak.disease}</td>
                    <td>${outbreak.numberOfLocations}</td>
                    <td>${outbreak.reportDate}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
            document.getElementById('news').innerHTML = html;
        } else {
            document.getElementById('news').innerHTML = '<div class="no-news">No outbreak data available for this country.</div>';
        }
    } catch (error) {
        console.error('Error fetching news data:', error);
        document.getElementById('news').innerHTML = '<div class="no-news">No outbreak data.</div>';
    }
}


// Fetch and render overview data for the overview tab
async function fetchOverviewData() {
    try {
        const response = await fetch('/.netlify/functions/get-overview-data');
        const data = await response.json();
        return data.rows || [];
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

// Usage: call this when a country is selected
async function updateOverviewTab() {
    const rows = await fetchOverviewData();
    document.getElementById('overview').innerHTML = renderOverviewTab(rows);
}

async function appendOverviewRowsToTable(iso) {
    try {
        const response = await fetch(`/.netlify/functions/get-scorecard-data?iso=${iso}`);
        const data = await response.json();
        const rows = data.rows || [];

        console.log('All rows:', rows);
        
        // Split rows based on ID values
        const biosecurityExplainerRows = rows.filter(row => {
            const id = parseInt(row.id);
            return !isNaN(id) && id >= 1 && id <= 5;
        });
        
        console.log('Filtered biosecurityExplainerRows:', biosecurityExplainerRows);
        const biosecurityTrackerRows = rows.filter(row => {
            const id = parseInt(row.id);
            return !isNaN(id) && id >= 6 && id <= 11;
        });
        const resourcesRow = rows.find(row => row.id === "12");

        // Update Biosecurity Explainer tab
        const biosecurityExplainerTable = document.querySelector('#biosecurityExplainer .info-table table');
        console.log('Biosecurity Explainer Table Element:', biosecurityExplainerTable);
        if (biosecurityExplainerTable) {
            Array.from(biosecurityExplainerTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            console.log('Processing biosecurityExplainerRows:', biosecurityExplainerRows);
            biosecurityExplainerRows.forEach(row => {
                if (!row.label || (!row.html && !row.text)) {
                    return;
                }
                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';
                const th = document.createElement('th');
                th.textContent = row.label;
                const td = document.createElement('td');
                td.innerHTML = row.html || row.text; // Use text if html is empty
                td.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
                tr.appendChild(th);
                tr.appendChild(td);
                biosecurityExplainerTable.appendChild(tr);
            });
        } else {
            console.log('Biosecurity Explainer table not found in DOM');
        }

        // Update Biosecurity Tracker tab
        const biosecurityTrackerTable = document.querySelector('#biosecurityTracker .info-table table');
        if (biosecurityTrackerTable) {
            Array.from(biosecurityTrackerTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            biosecurityTrackerRows.forEach(row => {
                if (!row.label || !row.html) return;
                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';
                const th = document.createElement('th');
                th.textContent = row.label;
                const td = document.createElement('td');
                td.innerHTML = row.html;
                // Apply color background 
                if (row.color) td.style.backgroundColor = row.color;

                td.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
                tr.appendChild(th);
                tr.appendChild(td);
                biosecurityTrackerTable.appendChild(tr);
            });
        }


     // Update Helpful Resources tab
        const resourcesTable = document.querySelector('#resources .info-table table');
        if (resourcesTable) {
            Array.from(resourcesTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            if (resourcesRow) {
                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';
                const th = document.createElement('th');
                th.textContent = resourcesRow.label;

                const td = document.createElement('td');

                // Split text by newline, clean empty lines
                const urls = resourcesRow.text.split('\n').filter(url => url.trim());

                const formattedContent = urls.map(url => 
                    `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display: block; margin: 5px 0;">${url}</a>`
                ).join('');

                td.innerHTML = formattedContent;
                td.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
                tr.appendChild(th);
                tr.appendChild(td);
                resourcesTable.appendChild(tr);
            }
        }


    } catch (error) {
        console.error('Error fetching overview data:', error);
    }
}


// Export functions for use in other files
window.updateNewsTab = updateNewsTab;
window.updateOverviewTab = updateOverviewTab;
window.appendOverviewRowsToTable = appendOverviewRowsToTable; 