// Map configuration
const width = window.innerWidth;
const height = window.innerHeight - 100;

// Remove the Google Sheets API configuration and functions
const SPREADSHEET_ID = '1m-X2TRl5MDlKUA2f5LqsjW0a98hFYujFg8mji-KZemo';
const API_KEY = 'AIzaSyAzL1yrTphXLIoC8qJWKNTDkw-4SoduHBo';

// Initialize the map
function initializeMap() {
    const svg = d3.select("#map")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoMercator()
        .scale((width - 3) / (2 * Math.PI))
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    // Zoom buttons functionality
    document.getElementById('zoomIn').addEventListener('click', () => {
        svg.transition()
            .duration(300)
            .call(zoom.scaleBy, 2);
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        svg.transition()
            .duration(300)
            .call(zoom.scaleBy, 0.5);
    });

    // Load and display the map
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(data => {
            const countries = topojson.feature(data, data.objects.countries);
            
            g.selectAll("path")
                .data(countries.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", path)
                .on("click", handleCountryClick);
        });
}

// Handle country click event
async function handleCountryClick(event, d) {
    const countryName = d.properties.name;
    $('#countryTitle').text(countryName);
    
    // Remove selected class from all countries
    d3.selectAll('.country').classed('selected', false);
    // Add selected class to clicked country
    d3.select(event.target).classed('selected', true);
    
    try {
        // Fetch country data from REST Countries API
        const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
        const [countryData] = await response.json();
        
        if (countryData) {
            // Format population with commas
            const formattedPopulation = countryData.population.toLocaleString();
            
            // Format area with commas and km²
            const formattedArea = countryData.area ? `${countryData.area.toLocaleString()} km²` : '-';
            
            // Get capital(s)
            const capital = countryData.capital ? countryData.capital.join(', ') : '-';
            
            // Get region and subregion
            const region = countryData.subregion ? `${countryData.region} (${countryData.subregion})` : countryData.region;
            
            // Get languages
            const languages = countryData.languages ? Object.values(countryData.languages).join(', ') : '-';
            
            // Get currencies
            const currencies = countryData.currencies ? 
                Object.values(countryData.currencies)
                    .map(curr => `${curr.name} (${curr.symbol})`)
                    .join(', ') : '-';
            
            // Get timezones
            const timezones = countryData.timezones ? countryData.timezones.join(', ') : '-';

            // Update the overview tab
            $('#capital').text(capital);
            $('#population').text(formattedPopulation);
            $('#area').text(formattedArea);
            $('#region').text(region);
            $('#languages').text(languages);
            $('#currencies').text(currencies);
            $('#timezones').text(timezones);
            
            // Add flag if available
            if (countryData.flags && countryData.flags.svg) {
                $('#countryFlag').attr('src', countryData.flags.svg).show();
            } else {
                $('#countryFlag').hide();
            }

            // Update animal outbreak tab using ISO2 code
            if (countryData.cca2) {
                window.updateAnimalOutbreakTab(countryData.cca2);
            }
            // Update overview table with score card rows using ISO3 code
            if (countryData.cca3 && window.appendOverviewRowsToTable) {
                window.appendOverviewRowsToTable(countryData.cca3);
            }
        }
    } catch (error) {
        console.error('Error fetching country data:', error);
        // Clear fields on error
        $('#capital, #population, #area, #region, #languages, #currencies, #timezones').text('-');
        $('#countryFlag').hide();
    }
    
    $('#infoDrawer').addClass('open');
}

// Function to fetch data from Google Sheets
async function fetchCountryData(countryName) {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A1:Z1000?key=${API_KEY}`);
        const data = await response.json();
        
        if (data.values) {
            // Skip header row
            const rows = data.values.slice(1);
            const countryRow = rows.find(row => row[0] === countryName);
            if (countryRow) {
                return {
                    countryIso3: countryRow[1] || '-',
                    governmentPortal: countryRow[2] || '-',
                    keywords: countryRow[3] || '-'
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Initialize tabs
function initializeTabs() {
    $('.tab').on('click', function() {
        $('.tab').removeClass('active');
        $('.tab-content').removeClass('active');
        $(this).addClass('active');
        $('#' + $(this).data('tab')).addClass('active');
    });
}

// Initialize drawer close functionality
function initializeDrawer() {
    document.getElementById('closeDrawer').addEventListener('click', () => {
        $('#infoDrawer').removeClass('open');
    });

    // Add expand/collapse functionality
    document.getElementById('expandDrawer').addEventListener('click', () => {
        const drawer = document.getElementById('infoDrawer');
        const expandButton = document.getElementById('expandDrawer');
        drawer.classList.toggle('expanded');
        expandButton.classList.toggle('expanded');
    });

    $(document).on('click', function(e) {
        if (!$(e.target).closest('#infoDrawer, #map').length || $(e.target).is('#closeDrawer')) {
            $('#infoDrawer').removeClass('open');
        }
    });
}

// Initialize everything when the page loads
window.onload = function() {
    initializeMap();
    initializeTabs();
    initializeDrawer();
}; 