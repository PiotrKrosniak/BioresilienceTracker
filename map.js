// Map configuration
const width = window.innerWidth;
const height = window.innerHeight - 100;

// Google API configuration

const SPREADSHEET_ID = '1m-X2TRl5MDlKUA2f5LqsjW0a98hFYujFg8mji-KZemo';

// Google Maps styling
const mapStyle = [
  {
    "featureType": "all",
    "elementType": "labels",
    "stylers": [
      { "visibility": "on" }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#ffffff" },
      { "visibility": "on" }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [
      { "color": "#000000" },
      { "visibility": "on" },
      { "weight": 2 }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#ffffff" },
      { "visibility": "on" },
      { "weight": 1.5 }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#ffffff" },
      { "visibility": "on" },
      { "weight": 1 }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.stroke",
    "stylers": [
      { "color": "#000000" },
      { "visibility": "on" },
      { "weight": 2 }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.icon",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [
      { "color": "#f5f5f5" },
      { "visibility": "on" }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      { "color": "#f5f5f5" },
      { "visibility": "on" }
    ]
  },
  {
    "featureType": "landscape.natural.terrain",
    "elementType": "geometry",
    "stylers": [
      { "visibility": "on" }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.business",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road.arterial",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];

let map;
let selectedCountry = null;
let countriesLayer = null;
let infoWindow = null;

// Initialize the map
function initializeMap() {
    const mapContainer = document.getElementById('map');
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';

    map = new google.maps.Map(mapContainer, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        styles: mapStyle,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'hybrid']
        }
    });

    // Create InfoWindow
    infoWindow = new google.maps.InfoWindow({
        disableAutoPan: true,
        pixelOffset: new google.maps.Size(0, -10)
    });

    // Load local GeoJSON data
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => response.json())
        .then(data => {
            // Filter out Antarctica
            const filteredData = {
                ...data,
                features: data.features.filter(feature => 
                    feature.id !== 'ATA' && // Antarctica
                    feature.id !== 'BVT' && // Bouvet Island
                    feature.id !== 'SGS' && // South Georgia and the South Sandwich Islands
                    feature.id !== 'HMD' && // Heard Island and McDonald Islands
                    feature.id !== 'ATF'    // French Southern Territories
                )
            };

            // Add GeoJSON layer
            countriesLayer = new google.maps.Data();
            countriesLayer.setMap(map);
            countriesLayer.addGeoJson(filteredData);

            // Style the countries
            countriesLayer.setStyle({
                fillOpacity: 0,         // fully transparent
                strokeColor: 'white',   // optional border color
                strokeWeight: 0         // set to 0 if you don't want borders either
            });

            // Add mouseover event
            countriesLayer.addListener('mouseover', async (event) => {
                const countryId = event.feature.getId();
                const countryName = event.feature.getProperty('name');
                
                // Skip if no valid country ID
                if (!countryId) return;

                try {
                    // Fetch country data
                    const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryId}`);
                    const [countryData] = await response.json();
                    
                    if (countryData) {
                        // Format population with commas
                        const formattedPopulation = countryData.population.toLocaleString();
                        
                        // Format area with commas and km²
                        const formattedArea = countryData.area ? `${countryData.area.toLocaleString()} km²` : '-';
                        
                        // Get capital(s)
                        const capital = countryData.capital ? countryData.capital.join(', ') : '-';

                        // Create InfoWindow content with pie chart container
                        const content = `
                            <div style="padding: 5px; min-width: 150px; min-height: 150px;">
                                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${countryName}</h3>
                                <div id="infographic-${countryId}" style="width: 150px; height: 150px; margin: 10px auto;"></div>
                            </div>
                        `;

                        // Get the center of the country's geometry
                        const bounds = new google.maps.LatLngBounds();
                        event.feature.getGeometry().forEachLatLng(latLng => bounds.extend(latLng));
                        const center = bounds.getCenter();

                        // Show InfoWindow
                        infoWindow.setContent(content);
                        infoWindow.setPosition(center);
                        infoWindow.open(map);

                        // Create pie chart data
                        const pieData = [
                            { name: 'Population', value: countryData.population },
                            { name: 'Area', value: countryData.area },
                            { name: 'Languages', value: Object.keys(countryData.languages || {}).length }
                        ];

                        // Create pie chart after InfoWindow is shown
                        setTimeout(() => {
                            createPieChart(pieData, `pieChart-${countryId}`);
                            createInfographic(`infographic-${countryId}`);
                        }, 100);
                    }
                } catch (error) {
                    console.error('Error fetching country data:', error);
                }
            });

            // Add mouseout event
            countriesLayer.addListener('mouseout', (event) => {
                infoWindow.close();
            });

            // Add click event
            countriesLayer.addListener('click', (event) => {
                const countryId = event.feature.getId();
                // Skip if no valid country ID
                if (!countryId) return;
                
                handleCountryClick(null, { 
                    properties: { 
                        iso3: countryId 
                    } 
                });
            });
        })
        .catch(error => console.error('Error loading GeoJSON:', error));
}

// Handle country click event
async function handleCountryClick(event, d) {
    const countryName = d.properties.name;
    $('#countryTitle').text(countryName);
    
    try {
        // Fetch country data from REST Countries API
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(d.properties.iso3)}`);
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
    
    // Show the drawer
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
    const closeDrawerBtn = document.getElementById('closeDrawer');
    const expandDrawerBtn = document.getElementById('expandDrawer');
    const drawer = document.getElementById('infoDrawer');

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', () => {
            if (drawer) {
                drawer.classList.remove('open');
            }
        });
    }

    if (expandDrawerBtn && drawer) {
        expandDrawerBtn.addEventListener('click', () => {
            drawer.classList.toggle('expanded');
            expandDrawerBtn.classList.toggle('expanded');
        });
    }

    $(document).on('click', function(e) {
        if (!$(e.target).closest('#infoDrawer, #map').length || $(e.target).is('#closeDrawer')) {
            if (drawer) {
                drawer.classList.remove('open');
            }
        }
    });
}

// Initialize everything when the page loads
window.onload = function() {
    initializeMap();
    initializeTabs();
    initializeDrawer();
};

function createPieChart(data, containerId) {
    const width = 150;
    const height = 150;
    const radius = Math.min(width, height) / 2;

    // Clear previous chart
    d3.select(`#${containerId}`).selectAll("*").remove();

    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.name))
        .range(['#3498db', '#2ecc71', '#e74c3c']);

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const arcs = svg.selectAll("arc")
        .data(pie(data))
        .enter()
        .append("g");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    // Add labels
    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "10px")
        .text(d => d.data.name);
}

function createInfographic(containerId) {
    const width = 300;
    const height = 300;
    const radius = 80;
    const labelOffset = 120;

    const data = [
        { label: "Clock", icon: "⏰", color: "#f39c12", triangleColor: "#2ecc71"  },
        { label: "Chat", icon: "💬", color: "#2ecc71", triangleColor: "#3498db"},
        { label: "Settings", icon: "⚙️", color: "#3498db", triangleColor: "#e74c3c" },
        { label: "User", icon: "👤", color: "#e74c3c", triangleColor: "#f39c12" },
    ];

    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("viewBox", [0, 0, width, height]);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
        .value(1)
        .sort(null)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI * 3 / 2);

    const arcs = pie(data).map((d, i) => {
        d.color = data[i].color;
        d.triangleColor = data[i].triangleColor;
        d.label = data[i].label;
        d.icon = data[i].icon;
        return d;
    });

    const arc = d3.arc().innerRadius(60).outerRadius(radius);

    g.selectAll("path.arc")
        .data(arcs)
        .enter()
        .append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .attr("fill", d => d.color);

    g.selectAll("path.triangle")
        .data(arcs)
        .enter()
        .append("path")
        .attr("class", "triangle")
        .attr("d", d => {
            const outerRadius = radius;
            const tipLength = 15;
            const angle = (d.startAngle + d.endAngle) /2;

            const tipX = Math.cos(angle) * (outerRadius + tipLength);
            const tipY = Math.sin(angle) * (outerRadius + tipLength);

            const baseOffsetAngle = 0.12;
            const base1X = Math.cos(angle - baseOffsetAngle) * outerRadius;
            const base1Y = Math.sin(angle - baseOffsetAngle) * outerRadius;
            const base2X = Math.cos(angle + baseOffsetAngle) * outerRadius;
            const base2Y = Math.sin(angle + baseOffsetAngle) * outerRadius;

            const path = d3.path();
            path.moveTo(base1X, base1Y);
            path.lineTo(base2X, base2Y);
            path.lineTo(tipX, tipY);
            path.closePath();
            return path.toString();
        })
        .attr("fill", d => d.triangleColor)
        .attr("stroke", "white")
        .attr("stroke-width", 0);

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("BIORESILIENCE SCORE");

    g.selectAll("g.label")
        .data(arcs)
        .enter()
        .append("g")
        .attr("class", "label")
        .attr("transform", d => {
            const [x, y] = d3.arc().innerRadius(labelOffset).outerRadius(labelOffset).centroid(d);
            return `translate(${x},${y})`;
        })
        .each(function (d) {
            const group = d3.select(this);
            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "-0.5em")
                .style("font-size", "14px")
                .text(d.icon);

            group.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "1.2em")
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .text(d.label);
        });
} 