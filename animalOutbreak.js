// animalOutbreak.js
// Fetch and display animal outbreak data for the selected country in the 'Biosecurity Thread Detection' tab

async function fetchAnimalOutbreaks(iso2) {
    try {
        const response = await fetch(`/.netlify/functions/get-country-data?iso=${iso2}`);
        const data = await response.json();
        if (data && data.outbreaks) {
            return data.outbreaks;
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
            `<td style="border:1px solid #ddd;padding:10px;text-align:left;">${row.disease}</td>` +
            `<td style="border:1px solid #ddd;padding:10px;text-align:left;">${row.numberOfLocations}</td>` +
            `<td style="border:1px solid #ddd;padding:10px;text-align:left;">${row.reportDate}</td>` +
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