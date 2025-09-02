// Map configuration
const mapWidth = window.innerWidth;
const mapHeight = window.innerHeight - 100;

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
let availableIsos = new Set();
let availableIsosLoaded = false;
// Simple in-memory cache for scorecard responses by ISO3
const scorecardCache = new Map();

async function getScorecardData(iso3) {
    if (scorecardCache.has(iso3)) {
        return scorecardCache.get(iso3);
    }
    // Try sessionStorage for persisted cache
    try {
        const cached = sessionStorage.getItem(`scorecard:${iso3}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            scorecardCache.set(iso3, parsed);
            return parsed;
        }
    } catch (e) {
        // ignore storage errors (e.g., private mode)
    }
    const response = await fetch(`/.netlify/functions/get-scorecard-data?iso=${encodeURIComponent(iso3)}`);
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Scorecard fetch failed (${response.status}): ${text}`);
    }
    const data = await response.json();
    // Only cache successful, well-formed responses
    if (data && (Array.isArray(data.rows) || data.countryInfo)) {
        scorecardCache.set(iso3, data);
        try {
            sessionStorage.setItem(`scorecard:${iso3}`, JSON.stringify(data));
        } catch (e) {
            // ignore quota/storage errors
        }
    }
    return data;
}

// Initialize the map
function initializeMap() {
    console.log('initializeMap function called');
    
    if (!google || !google.maps) {
        console.error('Google Maps API not loaded');
        return;
    }
    console.log('Google Maps API is loaded');

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }
    console.log('Map container found');

    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';

    map = new google.maps.Map(mapContainer, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        styles: mapStyle,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        mapTypeId: 'hybrid'
    });
    console.log('Google Map initialized');

    // Create InfoWindow
    // infoWindow = new google.maps.InfoWindow({
    //     disableAutoPan: true,
    //     pixelOffset: new google.maps.Size(0, -10)
    // });

    console.log('Fetching GeoJSON data...');
    // Load local GeoJSON data
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => {
            console.log('GeoJSON fetch response received:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('GeoJSON data loaded successfully. Features count:', data.features ? data.features.length : 0);
            
            // Filter out Antarctica
            const filteredData = {
                type: 'FeatureCollection',
                features: data.features.filter(feature => 
                    feature.id !== 'ATA' && // Antarctica
                    feature.id !== 'BVT' && // Bouvet Island
                    feature.id !== 'SGS' && // South Georgia and the South Sandwich Islands
                    feature.id !== 'HMD' && // Heard Island and McDonald Islands
                    feature.id !== 'ATF'    // French Southern Territories
                )
            };
            console.log('Filtered features count:', filteredData.features.length);

            // Add GeoJSON layer
            console.log('Creating Data layer...');
            countriesLayer = new google.maps.Data({
              map: map
              });
              
              // Set default neutral style for all features
              countriesLayer.setStyle(feature => ({
                strokeWeight: 0,
                fillOpacity: 0
              }));
          
            console.log('Data layer created');
            
            try {
                console.log('Adding GeoJSON to map...');
                countriesLayer.addGeoJson(filteredData);
                console.log('GeoJSON layer added successfully');

                // Function to apply styles only to countries with data
                const styleCountriesWithData = async () => {
                    try {
                        // Fetch available ISOs from our new endpoint
                        const response = await fetch('/.netlify/functions/get-available-isos');
                        const data = await response.json();
                        availableIsos = new Set(data.isos || []);
                        availableIsosLoaded = true;

                        countriesLayer.forEach(async (feature) => {
                            const countryId = feature.getId();
                            
                            if (!countryId) return;
                            
                            // Style countries that have data
                            if (availableIsos.has(countryId)) {
                                countriesLayer.overrideStyle(feature, {
                                    fillColor: '#155CC7',
                                    fillOpacity: 0.3,
                                    strokeColor: '#DDC709',
                                    strokeWeight: 0.1
                                });
                            }
                        });
                    } catch (error) {
                        console.error('Error styling countries with data:', error);
                    }
                };

                // Call the styling function
                styleCountriesWithData();
            } catch (error) {
                console.error('Error adding GeoJSON to map:', error);
            }

            // Add event listeners
            addMapEventListeners();
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
        });
}

// Add event listeners to the map
function addMapEventListeners() {
    // Add mouseout event
    countriesLayer.addListener('mouseout', (event) => {
        // infoWindow.close();
    });

    // Add click event
    countriesLayer.addListener('click', (event) => {
        const countryId = event.feature.getId();
        const countryName = event.feature.getProperty('name');
        if (!countryId) return;
        
        // Only allow opening details for countries that have data
        if (!availableIsosLoaded) {
            console.log('Available country list not loaded yet. Please try again.');
            return;
        }
        if (!availableIsos.has(countryId)) {
            console.log(`No data available for ${countryName} (${countryId}).`);
            return;
        }
        
        handleCountryClick(null, { 
            properties: { 
                iso3: countryId,
                name: countryName
            } 
        });
    });

    // Organization buttons handling (NATO / EU)
    const organizationMembers = {
        nato: new Set(["ALB","BEL","BGR","CAN","HRV","CZE","DNK","EST","FIN","FRA","DEU","GRC","HUN","ISL","ITA","LVA","LTU","LUX","MNE","NLD","MKD","NOR","POL","PRT","ROU","SVK","SVN","ESP","SWE","TUR","GBR","USA"]),
        eu: new Set(["AUT","BEL","BGR","HRV","CYP","CZE","DNK","EST","FIN","FRA","DEU","GRC","HUN","IRL","ITA","LVA","LTU","LUX","MLT","NLD","POL","PRT","ROU","SVK","SVN","ESP","SWE"])
    };

    function highlightOrganizationBorders(orgKey, activate) {
        if (!activate || !orgKey) {
            // Reset to default styling (keep data-highlight styling applied earlier)
            countriesLayer.revertStyle();
            // Re-apply data-available styling
            countriesLayer.forEach((feature) => {
                const id = feature.getId();
                if (availableIsos.has(id)) {
                    countriesLayer.overrideStyle(feature, {
                        fillColor: '#155CC7',
                        fillOpacity: 0.3,
                        strokeColor: '#DDC709',
                        strokeWeight: 0.1
                    });
                } else {
                    countriesLayer.overrideStyle(feature, {
                        fillOpacity: 0
                    });
                }
            });
            return;
        }

        const members = organizationMembers[orgKey];
        const memberStroke = orgKey === 'nato' ? '#2E7D32' : '#1976D2';

        countriesLayer.revertStyle();
        countriesLayer.forEach((feature) => {
            const id = feature.getId();
            const isMember = members.has(id);
            if (isMember) {
                countriesLayer.overrideStyle(feature, {
                    strokeColor: memberStroke,
                    strokeWeight: 1.2,
                    fillOpacity: 0.15
                });
            } else if (availableIsos.has(id)) {
                countriesLayer.overrideStyle(feature, {
                    fillColor: '#155CC7',
                    fillOpacity: 0.3,
                    strokeColor: '#DDC709',
                    strokeWeight: 0.1
                });
            } else {
                countriesLayer.overrideStyle(feature, {
                    fillOpacity: 0
                });
            }
        });
    }

    // Wire up buttons
    const buttons = document.querySelectorAll('.org-button');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const org = btn.getAttribute('data-org');
            const isActive = btn.classList.contains('active');
            document.querySelectorAll('.org-button').forEach(b => b.classList.remove('active'));
            if (!isActive) btn.classList.add('active');
            highlightOrganizationBorders(org, !isActive);
        });
    });
}

// Handle country click event
async function handleCountryClick(event, d) {
    if (!d || !d.properties || !d.properties.name) {
        console.error('Invalid country data:', d);
        return;
    }
    
    const countryName = d.properties.name;
    document.getElementById('countryTitle').textContent = countryName;
    // Show drawer immediately
    const drawer = document.getElementById('infoDrawer');
    if (drawer) {
        drawer.classList.add('open');
    }
    
    
    try {
        // Fetch once with caching
        const data = await getScorecardData(d.properties.iso3);
        
        if (data.countryInfo) {
            // Update the overview tab with country info
            $('#capital').text(data.countryInfo.capital);
            $('#population').text(data.countryInfo.population);
            $('#region').text(data.countryInfo.region);
            
            // Add flag if available
            if (data.countryInfo.flag) {
                $('#countryFlag').attr('src', data.countryInfo.flag).show();
            } else {
                $('#countryFlag').hide();
            }

            // Update overview table with pre-fetched score card rows to avoid refetch
            if (window.appendOverviewRowsToTable) {
                window.appendOverviewRowsToTable(d.properties.iso3, data);
            }

            // Update news tab with country-specific data
            if (window.updateNewsTab) {
                window.updateNewsTab(d.properties.iso3);
            }
        }
    } catch (error) {
        console.error('Error fetching country data:', error);
        // Clear fields on error
        $('#capital, #population, #area, #region, #languages, #currencies, #timezones').text('-');
        $('#countryFlag').hide();
    }
    
    // Drawer already opened above
}

// Function to fetch data from Google Sheets
async function fetchCountryData(countryName) {
    try {
        const response = await fetch(`/.netlify/functions/country-data?country=${encodeURIComponent(countryName)}`);
        const data = await response.json();
        
        if (data) {
            return {
                countryIso3: data.countryIso3 || '-',
                governmentPortal: data.governmentPortal || '-',
                keywords: data.keywords || '-'
            };
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
    const drawer = document.getElementById('infoDrawer');

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', () => {
            if (drawer) {
                drawer.classList.remove('open');
            }
        });
    }
}

// Initialize everything when the page loads
window.onload = function() {
    // Remove map initialization from here since it's handled by the script onload
    initializeTabs();
    initializeDrawer();
};

function createPieChart(data, containerId) {
    const width = 300;
    const height = 300;
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
        .style("font-size", "12px")
        .text(d => d.data.name);
}

function createInfographic(containerId, pillarColors = null) {
    const infographicWidth = 350;
    const infographicHeight = 350;
    const radius = 80;
    const labelOffset = radius + 50;

    const defaultColors = ["#f39c12", "#2ecc71", "#3498db", "#e74c3c"];
    const colors = (Array.isArray(pillarColors) && pillarColors.length === 4) ? pillarColors : defaultColors;

    const data = [
      { label: "Pillar I: Risk awareness\nand understanding", color: colors[0], triangleColor: colors[1], dx: -70,  dy: 0 },
      { label: "Pillar II: Early Warning\nand thread detection", color: colors[1], triangleColor: colors[2], dx: -60, dy: 0 },
      { label: "Pillar III: Prevention\nand deterrence", color: colors[2], triangleColor: colors[3], dx:70, dy:40 },
      { label: "Pillar IV: Readiness\nand response", color: colors[3], triangleColor: colors[0], dx: 40,  dy:  40 },
  ];

    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("viewBox", [0, 0, infographicWidth, infographicHeight]);

    const g = svg.append("g")
        .attr("transform", `translate(${infographicWidth / 2}, ${infographicHeight / 2})`);

    const pie = d3.pie()
        .value(1)
        .sort(null)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI * 3 / 2);

    const arcs = pie(data).map((d, i) => {
        // copy visual and meta properties from the corresponding data definition
        Object.assign(d, data[i]); // brings over color, triangleColor, label, icon, dx, dy, etc.
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

        const centralText = g.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold");
    
        centralText.append("tspan")
            .attr("x", 0)
            .attr("dy", "0em")
            .text("BIORESILIENCE");
        
        centralText.append("tspan")
            .attr("x", 0)
            .attr("dy", "1.2em")
            .text("SCORE");

            g.selectAll("g.label")
            .data(arcs)
            .enter()
            .append("g")
            .attr("class", "label")
            .attr("transform", d => {
              // Place each label on a virtual circle that is larger than the pie radius
              const [cx, cy] = d3.arc().innerRadius(labelOffset).outerRadius(labelOffset).centroid(d);
              // Optional fine-tuning per label – add dx / dy to the data objects if needed
              const dx = d.dx || 0;
              const dy = d.dy || 0;
              return `translate(${cx + dx},${cy + dy})`;
          })
          
            .each(function (d) {
                const group = d3.select(this);
                const lines = d.label.split('\n');
                // Set text-anchor based on which side of the circle the label sits
                const midAngle = (d.startAngle + d.endAngle) / 2;
                const anchor = (midAngle > Math.PI / 2 && midAngle < Math.PI * 3 / 2) ? "end" : "start";
                const labelText = group.append("text")
                    .attr("text-anchor", anchor)
                    .style("font-size", "14px")
                    .style("font-weight", "normal");
                
                lines.forEach((line, i) => {
                    labelText.append("tspan")
                        .attr("x", 0)
                        .attr("dy", i === 0 ? "-1.8em" : "1.5em")
                        .text(line);
                });
            });
}


