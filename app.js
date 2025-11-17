// DOM Elements
const spaceList = document.getElementById('spaceList');
const matterportViewer = document.getElementById('matterportViewer');
const currentSpaceTitle = document.getElementById('currentSpaceTitle');
const loadingMessage = document.getElementById('loadingMessage');
const placeholderMessage = document.getElementById('placeholderMessage');

// Current state
let spaces = [];
let currentSpaceId = null;

// Load spaces from JSON file
async function loadSpaces() {
    try {
        const response = await fetch('spaces.json');
        if (!response.ok) {
            throw new Error('Failed to load spaces.json');
        }
        spaces = await response.json();
        return spaces;
    } catch (error) {
        console.error('Error loading spaces:', error);
        return [];
    }
}

// Initialize the application
async function init() {
    await loadSpaces();
    renderSpaceList();
    // Auto-load the first space
    if (spaces.length > 0) {
        loadSpace(spaces[0]);
    }
}

// Render the list of spaces in the sidebar
function renderSpaceList() {
    spaceList.innerHTML = '';
    
    // Hide sidebar if there's only one space
    const sidebar = document.querySelector('.sidebar');
    if (spaces.length <= 1 && sidebar) {
        sidebar.style.display = 'none';
    }
    
    spaces.forEach(space => {
        const li = document.createElement('li');
        li.className = 'space-item';
        
        const button = document.createElement('button');
        button.className = 'space-button';
        button.dataset.spaceId = space.id;
        
        button.innerHTML = `
            <div class="space-name">${space.name}</div>
            <div class="space-description">${space.description}</div>
        `;
        
        button.addEventListener('click', () => loadSpace(space));
        
        li.appendChild(button);
        spaceList.appendChild(li);
    });
}

// Load a selected space
function loadSpace(space) {
    // Update active state
    document.querySelectorAll('.space-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-space-id="${space.id}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Update title
    currentSpaceTitle.textContent = space.name;
    
    // Hide placeholder
    placeholderMessage.classList.add('hidden');
    
    // Show loading message
    loadingMessage.classList.add('active');
    matterportViewer.classList.remove('active');
    
    // Load the Matterport model
    const embedUrl = `https://my.matterport.com/show/?m=${space.modelId}&play=1&qs=1`;
    
    // Set iframe source
    matterportViewer.src = embedUrl;
    
    // Update current space
    currentSpaceId = space.id;
    
    // Simulate loading completion (iframe load event is more reliable but slower)
    setTimeout(() => {
        loadingMessage.classList.remove('active');
        matterportViewer.classList.add('active');
    }, 2000);
}

// Handle iframe load event for better UX
matterportViewer.addEventListener('load', () => {
    if (currentSpaceId !== null) {
        loadingMessage.classList.remove('active');
        matterportViewer.classList.add('active');
    }
});

// Handle iframe errors
matterportViewer.addEventListener('error', () => {
    console.error('Failed to load Matterport space');
    loadingMessage.classList.remove('active');
    alert('Failed to load the Matterport space. The model may not be publicly accessible or the model ID may be incorrect.');
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!currentSpaceId) return;
    
    const currentIndex = spaces.findIndex(s => s.id === currentSpaceId);
    
    if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        loadSpace(spaces[currentIndex - 1]);
    } else if (e.key === 'ArrowDown' && currentIndex < spaces.length - 1) {
        e.preventDefault();
        loadSpace(spaces[currentIndex + 1]);
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
