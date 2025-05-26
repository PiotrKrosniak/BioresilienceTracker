// animalOutbreak.js
// Fetch and display animal outbreak data for the selected country in the 'Biosecurity Thread Detection' tab

const ANIMAL_OUTBREAK_SHEET = 'AnimalOutbreakTracker';
const ANIMAL_OUTBREAK_RANGE = 'A1:F1000'; // Date, ISO3, ISO2, Deasese, NumberOfLocations, ReportDates

async function fetchAnimalOutbreaks(iso2) {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${ANIMAL_OUTBREAK_SHEET}!${ANIMAL_OUTBREAK_RANGE}?key=${API_KEY}`);
        const data = await response.json();
        if (data.values && data.values.length > 1) {
            // Header: Date, ISO3, ISO2, Deasese, NumberOfLocations, ReportDates
            const rows = data.values.slice(1);
            // Filter by ISO2
            return rows.filter(row => row[2] && row[2].toUpperCase() === iso2.toUpperCase());
        }
        return [];
    } catch (error) {
        console.error('Error fetching animal outbreaks:', error);
        return [];
    }
}

function renderAnimalOutbreaksTable(rows) {
    if (!rows.length) {
        return '<div>No recent animal outbreaks reported for this country.</div>';
    }
    let html = '<div class="info-table"><table style="width:100%;border-collapse:collapse;">';
    html += '<thead><tr>' +
        '<th style="background:#f5f5f5;border:1px solid #ddd;padding:10px;text-align:left;">Disease</th>' +
        '<th style="background:#f5f5f5;border:1px solid #ddd;padding:10px;text-align:left;">Number of Locations</th>' +
        '<th style="background:#f5f5f5;border:1px solid #ddd;padding:10px;text-align:left;">Report Date</th>' +
        '</tr></thead><tbody>';
    rows.forEach((row, i) => {
        html += `<tr style="background:${i%2===0?'#fff':'#fafafa'};">` +
            `<td style="border:1px solid #ddd;padding:10px;text-align:left;">${row[3]}</td>` +
            `<td style="border:1px solid #ddd;padding:10px;text-align:left;">${row[4]}</td>` +
            `<td style="border:1px solid #ddd;padding:10px;text-align:left;">${row[5]}</td>` +
        '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
}

// Call this when a country is selected
async function updateAnimalOutbreakTab(iso2) {
    const rows = await fetchAnimalOutbreaks(iso2);
    document.getElementById('news').innerHTML = renderAnimalOutbreaksTable(rows);
}

// Export for use in map.js
window.updateAnimalOutbreakTab = updateAnimalOutbreakTab; 