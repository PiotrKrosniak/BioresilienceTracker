// newsData.js
// Fetch and display news data for different categories from Google Sheets

// Function to update news for a specific category
async function updateNewsTab(iso3) {
    console.log(`Updating government news tab for country: ${iso3}`);
    try {
        // Convert ISO-3 to ISO-2 using the REST Countries API
        const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/${iso3}`);
        const [countryData] = await countryResponse.json();
        const iso2 = countryData.cca2; // Get ISO-2 code

        const response = await fetch(`/.netlify/functions/get-country-data?iso=${iso2}`);
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
        
        // Split rows based on ID 
        const overviewRows = rows.filter(row => {
            const id = parseInt(row.id);
            return !isNaN(id) && (id === 1 || id === 2 || id === 3 || id === 12);
        });
        const biosecurityExplainerRows = rows.filter(row => {
            const id = parseInt(row.id);
            return (row.id === null) || (!isNaN(id) && (id === 6));
        });
        const biosecurityTrackerRows = rows.filter(row => {
            const id = parseInt(row.id);
            // Include rows 7 through 11 (inclusive) but exclude object with id "4"
            return !isNaN(id) && id >= 7 && id <= 11 && row.id !== "4";
        });
        const resourcesRow = rows.find(row => row.id === "12");


        // Update Overview tab
        const overviewTable = document.querySelector('#overview .info-table table');
        if (overviewTable) {
            Array.from(overviewTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            overviewRows.forEach(row => {
                if (!row.label && !row.text) {
                    return;
                }

                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';
                
                const th = document.createElement('th');
                th.textContent = row.label || row.text;
                
                const td = document.createElement('td');
                if (row.id === "12") {
                    // Special formatting for URLs
                    const urls = row.text.split('\n').filter(url => url.trim());
                    td.innerHTML = urls.map(url => 
                        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display: block; margin: 5px 0;">${url}</a>`
                    ).join('');
                } else {
                    td.innerHTML = row.html || row.text;
                }
                td.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
                
                tr.appendChild(th);
                tr.appendChild(td);
                overviewTable.appendChild(tr);
            });
        } else {
            console.log('Overview table not found in DOM');
        }
        
        // Update Biosecurity Explainer tab
        const biosecurityExplainerTable = document.querySelector('#biosecurityExplainer .info-table table');
        if (biosecurityExplainerTable) {
            Array.from(biosecurityExplainerTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            console.log('Processing biosecurityExplainerRows:', biosecurityExplainerRows);
            biosecurityExplainerRows.forEach(row => {
                // Skip if both label and text are empty
                if (!row.label && !row.text || row.label === "National\nCapabilities Map\n& Capability\nDirectory") {
                    return;
                }

                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';
                
                // Create header cell
                const th = document.createElement('th');
                // If id is null, use html for label, otherwise use label or text
                if (!row.id) {
                    th.innerHTML = row.html;
                } else {
                    th.textContent = row.label || row.text;
                }
                
                // Create content cell
                const td = document.createElement('td');
                // If id is null, use dHtml, otherwise use html or text
                if (!row.id) {
                    td.innerHTML = row.dHtml || row.dText;
                } else if (row.id === "6") {
                    td.innerHTML = row.dText || row.text; // Use columnD if available, fallback to text
                } else {
                    td.innerHTML = row.html || row.text;
                }
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
            // Clear any existing row7-text elements
            const existingRow7Text = document.querySelector('.row7-text');
            if (existingRow7Text) {
                existingRow7Text.remove();
            }

            // // First, handle row 7 as text above the table
            // const row7 = biosecurityTrackerRows.find(row => row.id === "7");
            // if (row7) {
            //     const textContainer = document.createElement('div');
            //     textContainer.className = 'row7-text';
            //     const content = row7.html || row7.text || '';
            //     textContainer.innerHTML = `
            //         <h3 style="margin-bottom: 15px; color: #333;">CSR Scorecard Guide</h3>
            //         <div style="display: flex; flex-direction: column; gap: 10px;">
            //             ${content.split('\n').map(line => {
            //                 if (line.trim()) {
            //                     const [number, ...rest] = line.split('.');
            //                     if (number && rest.length > 0) {
            //                         return `
            //                             <div style="display: flex; gap: 10px; align-items: flex-start; font-size: 14px;">
            //                                 <span style="font-weight: bold; min-width: 25px;">${number}.</span>
            //                                 <span>${rest.join('.').trim()}</span>
            //                             </div>
            //                         `;
            //                     }
            //                 }
            //                 return '';
            //             }).join('')}
            //         </div>
            //     `;
            //     textContainer.style.marginBottom = '20px';
            //     textContainer.style.padding = '15px';
            //     textContainer.style.backgroundColor = '#f8f9fa';
            //     textContainer.style.borderRadius = '8px';
            //     biosecurityTrackerTable.parentNode.insertBefore(textContainer, biosecurityTrackerTable);
            // }

            // Then handle the remaining rows in the table
            Array.from(biosecurityTrackerTable.querySelectorAll('.overview-extra-row')).forEach(row => row.remove());
            biosecurityTrackerRows.forEach(row => {
                // Skip row 7 as it's handled above
                if (row.id === "7") return;
                
                // Skip if both label and text are missing OR there is no content to show
                if ((!row.label && !row.text) || (!row.html && !row.text)) {
                    return;
                }

                const tr = document.createElement('tr');
                tr.className = 'overview-extra-row';

                const th = document.createElement('th');
                th.textContent = row.label || row.text || '';

                const td = document.createElement('td');
                td.innerHTML = row.html || row.text || '';

                // Apply color background if provided
                // if (row.color) td.style.backgroundColor = row.color;
                td.style.whiteSpace = 'pre-wrap';

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