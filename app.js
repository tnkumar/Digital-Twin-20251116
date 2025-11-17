// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const mainApp = document.getElementById('mainApp');
const logoutBtn = document.getElementById('logoutBtn');
const spaceList = document.getElementById('spaceList');
const matterportViewer = document.getElementById('matterportViewer');
const currentSpaceTitle = document.getElementById('currentSpaceTitle');
const loadingMessage = document.getElementById('loadingMessage');
const placeholderMessage = document.getElementById('placeholderMessage');
const highlightsSection = document.getElementById('highlightsSection');
const highlightsList = document.getElementById('highlightsList');
const viewAllTagsBtn = document.getElementById('viewAllTagsBtn');
const tagsModal = document.getElementById('tagsModal');
const tagsModalBody = document.getElementById('tagsModalBody');
const closeTagsModal = document.getElementById('closeTagsModal');

// Current state
let users = [];
let spaces = [];
let currentSpaceId = null;
let mpSdk = null;
let highlights = [];
let allTagsData = [];
let currentUser = null;

// Load users from JSON file
async function loadUsers() {
    try {
        const response = await fetch('users.json');
        if (!response.ok) {
            throw new Error('Failed to load users.json');
        }
        users = await response.json();
        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const session = localStorage.getItem('matterport_session');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            // Check if session is still valid (not expired)
            if (sessionData.expires && new Date(sessionData.expires) > new Date()) {
                currentUser = sessionData.user;
                return true;
            } else {
                // Session expired
                localStorage.removeItem('matterport_session');
                return false;
            }
        } catch (e) {
            localStorage.removeItem('matterport_session');
            return false;
        }
    }
    return false;
}

// Authenticate user
function authenticate(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        // Create session (expires in 24 hours)
        const sessionData = {
            user: { username: user.username },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem('matterport_session', JSON.stringify(sessionData));
        currentUser = sessionData.user;
        return true;
    }
    return false;
}

// Logout user
function logout() {
    localStorage.removeItem('matterport_session');
    currentUser = null;
    showLogin();
}

// Show login screen
function showLogin() {
    loginModal.style.display = 'flex';
    mainApp.style.display = 'none';
    // Clear form
    loginForm.reset();
    loginError.style.display = 'none';
}

// Show main application
function showMainApp() {
    loginModal.style.display = 'none';
    mainApp.style.display = 'flex';
}

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
    // Load users first
    await loadUsers();
    
    // Check authentication
    if (isAuthenticated()) {
        showMainApp();
        await loadSpaces();
        renderSpaceList();
        // Auto-load the first space
        if (spaces.length > 0) {
            loadSpace(spaces[0]);
        }
    } else {
        showLogin();
    }
    
    // Add event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            loginError.style.display = 'none';
            
            if (!username || !password) {
                loginError.textContent = 'Please enter both username and password';
                loginError.style.display = 'block';
                return;
            }
            
            if (authenticate(username, password)) {
                showMainApp();
                await loadSpaces();
                renderSpaceList();
                // Auto-load the first space
                if (spaces.length > 0) {
                    loadSpace(spaces[0]);
                }
            } else {
                loginError.textContent = 'Invalid username or password';
                loginError.style.display = 'block';
            }
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
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
    
    // Clear previous highlights
    highlights = [];
    allTagsData = [];
    highlightsList.innerHTML = '';
    highlightsSection.style.display = 'none';
    if (viewAllTagsBtn) viewAllTagsBtn.style.display = 'none';
    mpSdk = null;
    
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

// Connect to Matterport SDK
async function connectSDK() {
    try {
        // Wait a bit for the iframe to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if SDK is available
        if (typeof window.MP_SDK === 'undefined') {
            console.warn('Matterport SDK not available. Highlights navigation will be disabled.');
            console.log('SDK loading status:', {
                windowMP_SDK: typeof window.MP_SDK,
                scriptLoaded: document.querySelector('script[type="module"]') !== null
            });
            return null;
        }

        console.log('Attempting to connect to Matterport SDK...');
        
        // Connect to the SDK (empty string for applicationKey means using public access)
        mpSdk = await window.MP_SDK.connect(matterportViewer, '', '3.11');
        console.log('Matterport SDK connected successfully');
        
        // Wait a bit more for the model to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Load highlights after connection
        await loadHighlights();
        
        return mpSdk;
    } catch (error) {
        console.error('Failed to connect to Matterport SDK:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            SDKAvailable: typeof window.MP_SDK !== 'undefined'
        });
        
        // Try alternative method - accessing SDK from iframe
        try {
            console.log('Trying alternative SDK connection method...');
            if (matterportViewer.contentWindow && matterportViewer.contentWindow.MP_SDK) {
                mpSdk = await matterportViewer.contentWindow.MP_SDK.connect(matterportViewer, '', '3.11');
                console.log('Alternative SDK connection successful');
                await loadHighlights();
                return mpSdk;
            } else {
                console.warn('SDK not found in iframe contentWindow');
            }
        } catch (e) {
            console.error('Alternative SDK connection also failed:', e);
        }
        return null;
    }
}

// Load highlights from the current Matterport space
async function loadHighlights() {
    if (!mpSdk) {
        console.warn('Cannot load highlights: SDK not connected');
        return;
    }
    
    try {
        console.log('Loading highlights/tags...');
        // Get tags (highlights) from the model
        // Try different methods to get highlights/tags
        let tags = [];
        
        try {
            console.log('Trying mpSdk.Tag.getData()...');
            tags = await mpSdk.Tag.getData();
            console.log('Tags loaded via Tag.getData():', tags);
        } catch (e) {
            console.warn('Tag.getData() failed:', e.message);
            // Try alternative method
            try {
                console.log('Trying mpSdk.Model.getData()...');
                const model = await mpSdk.Model.getData();
                console.log('Model data:', model);
                if (model && model.tags) {
                    tags = model.tags;
                    console.log('Tags found in model data:', tags);
                } else if (model && model.sweeps) {
                    // Sometimes tags are associated with sweeps
                    console.log('Checking sweeps for tags...');
                    const sweeps = model.sweeps || [];
                    for (const sweep of sweeps) {
                        if (sweep.tags && sweep.tags.length > 0) {
                            tags = tags.concat(sweep.tags);
                        }
                    }
                }
            } catch (e2) {
                console.warn('Could not load tags using alternative method:', e2.message);
            }
        }
        
        // Store all tag data for detailed view
        allTagsData = Array.isArray(tags) ? tags : [];
        highlights = allTagsData;
        
        console.log(`Found ${allTagsData.length} tags/highlights`);
        
        // Render highlights
        renderHighlights();
    } catch (error) {
        console.error('Failed to load highlights:', error);
        console.error('Error details:', error.message, error.stack);
        highlights = [];
        allTagsData = [];
        renderHighlights();
    }
}

// Render highlights list
function renderHighlights() {
    highlightsList.innerHTML = '';
    
    if (highlights.length === 0) {
        highlightsSection.style.display = 'none';
        if (viewAllTagsBtn) viewAllTagsBtn.style.display = 'none';
        return;
    }
    
    highlightsSection.style.display = 'block';
    
    // Show the view all tags button if tags exist
    if (viewAllTagsBtn && allTagsData.length > 0) {
        viewAllTagsBtn.style.display = 'block';
    } else if (viewAllTagsBtn) {
        viewAllTagsBtn.style.display = 'none';
    }
    
    highlights.forEach((highlight, index) => {
        const li = document.createElement('li');
        li.className = 'highlight-item';
        
        const button = document.createElement('button');
        button.className = 'highlight-button';
        // Try different properties for the label
        const label = highlight.label || highlight.name || highlight.title || `Highlight ${index + 1}`;
        button.textContent = label;
        button.addEventListener('click', () => navigateToHighlight(highlight));
        
        li.appendChild(button);
        highlightsList.appendChild(li);
    });
}

// Display all tags information in modal
function displayAllTagsInfo() {
    if (!allTagsData || allTagsData.length === 0) {
        tagsModalBody.innerHTML = '<p>No tags available in this space.</p>';
        tagsModal.style.display = 'flex';
        return;
    }
    
    let html = `<div class="tags-summary">Total Tags: <strong>${allTagsData.length}</strong></div>`;
    
    allTagsData.forEach((tag, index) => {
        html += `
            <div class="tag-info-card">
                <div class="tag-info-header">
                    <h4>Tag ${index + 1}: ${tag.label || tag.name || tag.title || 'Unnamed Tag'}</h4>
                </div>
                <div class="tag-info-body">
                    <div class="tag-info-row">
                        <strong>ID:</strong> <code>${tag.id || tag.sid || 'N/A'}</code>
                    </div>
                    ${tag.description ? `
                    <div class="tag-info-row">
                        <strong>Description:</strong> ${tag.description}
                    </div>
                    ` : ''}
                    ${tag.anchor ? `
                    <div class="tag-info-row">
                        <strong>Anchor:</strong> <code>${tag.anchor}</code>
                    </div>
                    ` : ''}
                    ${tag.sid ? `
                    <div class="tag-info-row">
                        <strong>Sweep ID:</strong> <code>${tag.sid}</code>
                    </div>
                    ` : ''}
                    ${tag.position ? `
                    <div class="tag-info-row">
                        <strong>Position:</strong> 
                        <code>X: ${tag.position.x || 'N/A'}, Y: ${tag.position.y || 'N/A'}, Z: ${tag.position.z || 'N/A'}</code>
                    </div>
                    ` : ''}
                    ${tag.rotation ? `
                    <div class="tag-info-row">
                        <strong>Rotation:</strong> 
                        <code>X: ${tag.rotation.x || 'N/A'}, Y: ${tag.rotation.y || 'N/A'}, Z: ${tag.rotation.z || 'N/A'}</code>
                    </div>
                    ` : ''}
                    <div class="tag-info-row">
                        <strong>Full Data:</strong>
                        <pre class="tag-json">${JSON.stringify(tag, null, 2)}</pre>
                    </div>
                    <button class="navigate-tag-btn" onclick="navigateToTagFromModal(${index})">Navigate to this tag</button>
                </div>
            </div>
        `;
    });
    
    tagsModalBody.innerHTML = html;
    tagsModal.style.display = 'flex';
}

// Navigate to tag from modal
window.navigateToTagFromModal = function(index) {
    if (allTagsData[index]) {
        navigateToHighlight(allTagsData[index]);
        tagsModal.style.display = 'none';
    }
};

// Navigate to a specific highlight
async function navigateToHighlight(highlight) {
    if (!mpSdk) {
        console.error('SDK not connected');
        return;
    }
    
    try {
        // Navigate to the highlight using the tag's anchor or sweep ID
        if (highlight.anchor) {
            await mpSdk.Sweep.moveTo(highlight.anchor);
        } else if (highlight.sid) {
            await mpSdk.Sweep.moveTo(highlight.sid);
        } else if (highlight.sweep) {
            await mpSdk.Sweep.moveTo(highlight.sweep);
        } else if (highlight.id) {
            // Try using the tag ID
            await mpSdk.Tag.navigateTo(highlight.id);
        }
        console.log('Navigated to highlight:', highlight.label || highlight.name);
    } catch (error) {
        console.error('Failed to navigate to highlight:', error);
        // Try alternative navigation method
        try {
            if (highlight.anchor) {
                await mpSdk.Camera.moveTo(highlight.anchor);
            }
        } catch (e2) {
            console.error('Alternative navigation also failed:', e2);
            alert('Failed to navigate to highlight. The highlight may not be available in this space.');
        }
    }
}

// Handle iframe load event for better UX
matterportViewer.addEventListener('load', async () => {
    if (currentSpaceId !== null) {
        loadingMessage.classList.remove('active');
        matterportViewer.classList.add('active');
        
        // Connect to SDK after iframe loads
        await connectSDK();
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
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Add event listeners for tags modal
    if (viewAllTagsBtn) {
        viewAllTagsBtn.addEventListener('click', displayAllTagsInfo);
    }
    
    if (closeTagsModal) {
        closeTagsModal.addEventListener('click', () => {
            tagsModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    if (tagsModal) {
        tagsModal.addEventListener('click', (e) => {
            if (e.target === tagsModal) {
                tagsModal.style.display = 'none';
            }
        });
    }
});
