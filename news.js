import config from './config.js';

const TICKER_SPEED = 30; // pixels per second - slower for better readability
let currentPosition = 0;
let newsItems = [];
let isTickerPaused = false;
let animationFrameId = null;

// Function to update time
function updateTime() {
    const timeElement = document.getElementById('tickerTime');
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes} ET`;
}

// Function to fetch health news
async function fetchHealthNews() {
    try {
        const response = await fetch('http://localhost:3000/api/news');
        const data = await response.json();
        if (data.values && data.values.length > 1) {
            // Header: Title (A), Description (B), URL (C), Source (D), Published Date (E), Country (F), Language (G)
            newsItems = data.values.slice(1).map(row => ({
                title: row[0] || '',
                source: row[3] || '',
                url: row[2] || '#'
            })).filter(item => item.title && item.source);
            updateTicker();
        }
    } catch (error) {
        console.error('Error fetching news from server:', error);
        newsItems = [];
        updateTicker();
    }
}

// Function to create ticker items
function createTickerItem(news) {
    const tickerItem = document.createElement('div');
    tickerItem.className = 'ticker-item';
    
    const source = document.createElement('span');
    source.className = 'ticker-source';
    source.textContent = `${news.source}: `;
    
    const title = document.createElement('span');
    title.className = 'ticker-title';
    title.textContent = news.title;
    
    tickerItem.appendChild(source);
    tickerItem.appendChild(title);
    
    // Make the ticker item clickable
    tickerItem.addEventListener('click', () => {
        window.open(news.url, '_blank');
    });

    // Add hover events for pausing
    tickerItem.addEventListener('mouseenter', () => {
        isTickerPaused = true;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });

    tickerItem.addEventListener('mouseleave', () => {
        isTickerPaused = false;
        if (!animationFrameId) {
            animateTicker();
        }
    });
    
    return tickerItem;
}

// Function to update the ticker
function updateTicker() {
    const tickerContainer = document.getElementById('newsTicker');
    tickerContainer.innerHTML = '';
    
    // Create a container for all ticker items
    const tickerContent = document.createElement('div');
    tickerContent.className = 'ticker-content';
    
    // Add all news items to the ticker
    newsItems.forEach(news => {
        tickerContent.appendChild(createTickerItem(news));
    });
    
    // Clone the content for seamless looping
    const clonedContent = tickerContent.cloneNode(true);
    tickerContent.appendChild(clonedContent);
    
    tickerContainer.appendChild(tickerContent);
    
    // Reset position and start the animation
    currentPosition = 0;
    
    // Cancel any existing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animateTicker();
}

// Function to animate the ticker
function animateTicker() {
    if (isTickerPaused) {
        return;
    }

    const tickerContent = document.querySelector('.ticker-content');
    const tickerWidth = tickerContent.offsetWidth;
    
    // Reset position if we've scrolled the full width
    if (currentPosition <= -tickerWidth / 2) {
        currentPosition = 0;
    }
    
    // Update position
    currentPosition -= 0.5; // Slower scroll speed
    tickerContent.style.transform = `translateX(${currentPosition}px)`;
    
    // Continue animation
    animationFrameId = requestAnimationFrame(animateTicker);
}

// Initialize the news ticker
function initializeNewsTicker() {
    fetchHealthNews();
    updateTime();
    
    // Update time every minute
    setInterval(updateTime, 60000);
    
    // Refresh news every 5 minutes
    setInterval(fetchHealthNews, 5 * 60 * 1000);
}

// Start the news ticker when the page loads
window.addEventListener('load', initializeNewsTicker);