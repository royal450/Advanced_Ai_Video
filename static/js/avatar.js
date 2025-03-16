/**
 * Avatar selection and management functionality
 * Handles avatar selection, filtering, and related UI operations
 */

// State management
let avatarData = {
  avatars: [],
  voices: [],
  selectedAvatar: null,
  selectedVoice: null,
  filteredAvatars: [],
  activeCategory: 'all',
  activeGender: 'all'
};

// DOM elements
let avatarGrid;
let categoryFilters;
let genderFilters;
let voiceSelector;

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  avatarGrid = document.getElementById('avatar-grid');
  categoryFilters = document.getElementById('category-filters');
  genderFilters = document.getElementById('gender-filters');
  voiceSelector = document.getElementById('voice-selector');
  
  // Fetch avatar data
  fetchAvatarData();
  
  // Set up event listeners
  setupEventListeners();
  
  // Check for preselected avatar from URL
  checkUrlParameters();
});

/**
 * Fetch avatar data from the server
 */
function fetchAvatarData() {
  window.UI?.showLoading('Loading avatars...');
  
  fetch('/api/avatars')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch avatars');
      }
      return response.json();
    })
    .then(data => {
      window.UI?.hideLoading();
      
      if (!data || !data.avatars) {
        throw new Error('Invalid avatar data');
      }
      
      // Store the data
      avatarData.avatars = data.avatars;
      avatarData.voices = data.voices || [];
      avatarData.filteredAvatars = [...avatarData.avatars];
      
      // Render the UI
      renderAvatarGrid();
      initializeCategoryFilters();
      initializeVoiceSelector();
    })
    .catch(error => {
      window.UI?.hideLoading();
      window.UI?.showNotification(`Error loading avatars: ${error.message}`, 'danger');
      console.error('Error loading avatars:', error);
    });
}

/**
 * Set up event listeners for avatar page interactions
 */
function setupEventListeners() {
  // Event delegation for avatar grid
  if (avatarGrid) {
    avatarGrid.addEventListener('click', (e) => {
      const avatarItem = e.target.closest('.avatar-item');
      if (avatarItem) {
        const avatarId = avatarItem.getAttribute('data-avatar-id');
        selectAvatar(avatarId);
      }
    });
  }
  
  // Text input character count
  const textInput = document.getElementById('text-input');
  const charCount = document.getElementById('char-count');
  
  if (textInput && charCount) {
    textInput.addEventListener('input', () => {
      const count = textInput.value.length;
      charCount.textContent = `${count} characters`;
      
      // Enable/disable generate button based on text input
      const generateBtn = document.getElementById('generate-btn');
      if (generateBtn) {
        generateBtn.disabled = count === 0 || !avatarData.selectedAvatar;
      }
    });
  }
  
  // Generate button
  const generateForm = document.getElementById('generate-form');
  if (generateForm) {
    generateForm.addEventListener('submit', handleGeneration);
  }
  
  // Preview button
  const previewBtn = document.getElementById('preview-btn');
  if (previewBtn) {
    previewBtn.addEventListener('click', handlePreview);
  }
}

/**
 * Render the avatar grid with available avatars
 */
function renderAvatarGrid() {
  if (!avatarGrid) return;
  
  // Clear existing content
  avatarGrid.innerHTML = '';
  
  // Create and append avatar items
  avatarData.filteredAvatars.forEach(avatar => {
    const avatarElement = createAvatarElement(avatar);
    avatarGrid.appendChild(avatarElement);
  });
  
  // If no avatars match the filters
  if (avatarData.filteredAvatars.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'col-12 text-center p-5';
    noResults.innerHTML = `
      <div class="text-muted">
        <i class="fas fa-search fa-3x mb-3"></i>
        <h5>No avatars match your filters</h5>
        <p>Try adjusting your filter criteria</p>
      </div>
    `;
    avatarGrid.appendChild(noResults);
  }
  
  // If there was a previously selected avatar, reselect it
  if (avatarData.selectedAvatar) {
    const selectedElement = avatarGrid.querySelector(`[data-avatar-id="${avatarData.selectedAvatar.id}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    } else {
      // If the selected avatar is no longer in the filtered list, clear the selection
      avatarData.selectedAvatar = null;
      updateGenerateButtonState();
    }
  }
}

/**
 * Create an avatar element
 * @param {Object} avatar - The avatar data
 * @returns {HTMLElement} - The avatar element
 */
function createAvatarElement(avatar) {
  const element = document.createElement('div');
  element.className = 'avatar-item';
  element.setAttribute('data-avatar-id', avatar.id);
  element.setAttribute('data-category', avatar.category);
  element.setAttribute('data-gender', avatar.gender);
  
  // Check if this is the selected avatar
  if (avatarData.selectedAvatar && avatarData.selectedAvatar.id === avatar.id) {
    element.classList.add('selected');
  }
  
  // Determine the image source
  const imageSrc = avatar.preview_image || `/static/images/avatars/${avatar.id}_preview.svg`;
  
  element.innerHTML = `
    <div class="avatar-image">
      <img src="${imageSrc}" alt="${avatar.name}" class="img-fluid" onerror="this.onerror=null; this.src='/static/images/avatar-placeholder.svg';">
    </div>
    <div class="avatar-info">
      <h6 class="avatar-name">${avatar.name}</h6>
      <p class="avatar-description">${avatar.description || `${avatar.category} avatar`}</p>
    </div>
  `;
  
  return element;
}

/**
 * Initialize category filter buttons
 */
function initializeCategoryFilters() {
  if (!categoryFilters || !genderFilters) return;
  
  // Extract unique categories
  const categories = [...new Set(avatarData.avatars.map(avatar => avatar.category))];
  
  // Create category pills
  categoryFilters.innerHTML = `
    <div class="category-pill active" data-category="all">All</div>
    ${categories.map(category => `
      <div class="category-pill" data-category="${category}">${capitalizeFirstLetter(category)}</div>
    `).join('')}
  `;
  
  // Add event listeners to category pills
  categoryFilters.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      // Update active state
      categoryFilters.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      // Update filter state
      avatarData.activeCategory = pill.getAttribute('data-category');
      
      // Apply filters
      applyFilters();
    });
  });
  
  // Gender filters
  genderFilters.innerHTML = `
    <div class="category-pill active" data-gender="all">All</div>
    <div class="category-pill" data-gender="male">Male</div>
    <div class="category-pill" data-gender="female">Female</div>
  `;
  
  // Add event listeners to gender pills
  genderFilters.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      // Update active state
      genderFilters.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      // Update filter state
      avatarData.activeGender = pill.getAttribute('data-gender');
      
      // Apply filters
      applyFilters();
    });
  });
}

/**
 * Initialize voice selector
 */
function initializeVoiceSelector() {
  if (!voiceSelector) return;
  
  // Create voice options
  if (avatarData.voices && avatarData.voices.length > 0) {
    // Group voices by language
    const voicesByLanguage = avatarData.voices.reduce((acc, voice) => {
      if (!acc[voice.language]) {
        acc[voice.language] = [];
      }
      acc[voice.language].push(voice);
      return acc;
    }, {});
    
    // Create HTML for each language group
    let voiceHtml = '';
    Object.keys(voicesByLanguage).forEach(language => {
      voiceHtml += `<h6 class="mt-3 mb-2">${language}</h6>`;
      
      voicesByLanguage[language].forEach(voice => {
        voiceHtml += `
          <div class="voice-option" data-voice-id="${voice.id}">
            <input type="radio" name="voice" id="voice-${voice.id}" value="${voice.id}" ${voice.id === 'en-US-AriaNeural' ? 'checked' : ''}>
            <label for="voice-${voice.id}" class="ms-2 w-100">
              <div class="voice-name">${voice.name}</div>
              <div class="voice-description">${voice.gender}</div>
            </label>
          </div>
        `;
      });
    });
    
    voiceSelector.innerHTML = voiceHtml;
    
    // Set default voice
    avatarData.selectedVoice = avatarData.voices.find(v => v.id === 'en-US-AriaNeural') || avatarData.voices[0];
    
    // Add event listeners to voice options
    voiceSelector.querySelectorAll('.voice-option').forEach(option => {
      option.addEventListener('click', () => {
        // Update UI
        voiceSelector.querySelectorAll('.voice-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        
        // Update radio button
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
        }
        
        // Update selected voice
        const voiceId = option.getAttribute('data-voice-id');
        avatarData.selectedVoice = avatarData.voices.find(v => v.id === voiceId);
      });
    });
    
    // Select default voice
    const defaultVoiceOption = voiceSelector.querySelector(`.voice-option[data-voice-id="${avatarData.selectedVoice.id}"]`);
    if (defaultVoiceOption) {
      defaultVoiceOption.classList.add('selected');
    }
  } else {
    voiceSelector.innerHTML = `
      <div class="alert alert-warning">
        No voices available. Please try again later.
      </div>
    `;
  }
}

/**
 * Apply filters to the avatar list
 */
function applyFilters() {
  // Filter avatars based on active category and gender
  avatarData.filteredAvatars = avatarData.avatars.filter(avatar => {
    const categoryMatch = avatarData.activeCategory === 'all' || avatar.category === avatarData.activeCategory;
    const genderMatch = avatarData.activeGender === 'all' || avatar.gender === avatarData.activeGender;
    return categoryMatch && genderMatch;
  });
  
  // Re-render the grid
  renderAvatarGrid();
}

/**
 * Select an avatar
 * @param {string} avatarId - The ID of the avatar to select
 */
function selectAvatar(avatarId) {
  // Find the avatar in the data
  const avatar = avatarData.avatars.find(a => a.id === avatarId);
  
  if (!avatar) {
    console.error(`Avatar with ID ${avatarId} not found`);
    return;
  }
  
  // Update state
  avatarData.selectedAvatar = avatar;
  
  // Update UI
  document.querySelectorAll('.avatar-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  const selectedElement = document.querySelector(`.avatar-item[data-avatar-id="${avatarId}"]`);
  if (selectedElement) {
    selectedElement.classList.add('selected');
  }
  
  // Update avatar info display
  updateSelectedAvatarInfo(avatar);
  
  // Update generate button state
  updateGenerateButtonState();
}

/**
 * Update the selected avatar info display
 * @param {Object} avatar - The selected avatar data
 */
function updateSelectedAvatarInfo(avatar) {
  const avatarInfo = document.getElementById('selected-avatar-info');
  if (!avatarInfo) return;
  
  avatarInfo.innerHTML = `
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">Selected Avatar</h5>
        <div class="d-flex align-items-center">
          <div class="me-3" style="width: 60px; height: 60px; overflow: hidden; border-radius: 8px;">
            <img src="${avatar.preview || `/static/images/avatars/${avatar.id}_preview.svg`}" 
                 alt="${avatar.name}" 
                 class="img-fluid"
                 onerror="this.onerror=null; this.src='/static/images/avatar-placeholder.svg';">
          </div>
          <div>
            <h6 class="mb-1">${avatar.name}</h6>
            <p class="small text-muted mb-0">${avatar.description || `${avatar.category} avatar`}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Update the state of the generate button based on selections
 */
function updateGenerateButtonState() {
  const generateBtn = document.getElementById('generate-btn');
  const textInput = document.getElementById('text-input');
  
  if (!generateBtn || !textInput) return;
  
  // Enable button only if avatar is selected and text is not empty
  generateBtn.disabled = !avatarData.selectedAvatar || textInput.value.trim().length === 0;
}

/**
 * Handle the generation form submission
 * @param {Event} e - The form submission event
 */
function handleGeneration(e) {
  e.preventDefault();
  
  // Check requirements
  if (!avatarData.selectedAvatar || !avatarData.selectedVoice) {
    window.UI?.showNotification('Please select an avatar and voice.', 'warning');
    return;
  }
  
  const textInput = document.getElementById('text-input');
  if (!textInput || textInput.value.trim().length === 0) {
    window.UI?.showNotification('Please enter text for the avatar to speak.', 'warning');
    return;
  }
  
  // Prepare data
  const data = {
    text: textInput.value,
    avatar_id: avatarData.selectedAvatar.id,
    voice: avatarData.selectedVoice.id
  };
  
  // Show loading
  window.UI?.showLoading('Starting video generation...');
  
  // Send request to server
  fetch('/api/generate-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to generate video');
      }
      return response.json();
    })
    .then(data => {
      // The actual video processing updates will come through Socket.IO
      console.log('Video generation initiated:', data);
    })
    .catch(error => {
      window.UI?.hideLoading();
      window.UI?.showNotification(`Error: ${error.message}`, 'danger');
      console.error('Error generating video:', error);
    });
}

/**
 * Handle preview generation
 */
function handlePreview() {
  // Check requirements
  if (!avatarData.selectedAvatar || !avatarData.selectedVoice) {
    window.UI?.showNotification('Please select an avatar and voice.', 'warning');
    return;
  }
  
  const textInput = document.getElementById('text-input');
  if (!textInput || textInput.value.trim().length === 0) {
    window.UI?.showNotification('Please enter text for the avatar to speak.', 'warning');
    return;
  }
  
  // Prepare data for preview
  const previewData = {
    text: textInput.value.substring(0, 50) + (textInput.value.length > 50 ? '...' : ''), // Limit text for preview
    avatar_id: avatarData.selectedAvatar.id,
    voice: avatarData.selectedVoice.id
  };
  
  // Request preview via Socket.IO
  if (window.SocketHandler) {
    window.SocketHandler.requestPreview(previewData);
  } else {
    window.UI?.showNotification('Preview functionality not available.', 'warning');
  }
}

/**
 * Check URL parameters for preselected avatar
 */
function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedAvatarId = urlParams.get('selected');
  
  if (selectedAvatarId) {
    // Wait for avatars to load, then select
    const checkInterval = setInterval(() => {
      if (avatarData.avatars.length > 0) {
        clearInterval(checkInterval);
        selectAvatar(selectedAvatarId);
      }
    }, 100);
  }
}

/**
 * Utility function to capitalize the first letter of a string
 * @param {string} string - The string to capitalize
 * @returns {string} - The capitalized string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Custom event handler for preview updates
window.onPreviewUpdate = function(data) {
  const previewContainer = document.getElementById('preview-container');
  if (!previewContainer) return;
  
  if (data.status === 'completed' && data.preview_data) {
    const { preview_url, avatar_id, text } = data.preview_data;
    
    previewContainer.innerHTML = `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Preview</h5>
          <span class="badge bg-success">Ready</span>
        </div>
        <div class="card-body p-0">
          <video id="preview-video" controls class="w-100">
            <source src="${preview_url}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        <div class="card-footer bg-light">
          <div class="small text-muted">${text}</div>
        </div>
      </div>
    `;
    
    // Auto-play the preview
    const video = document.getElementById('preview-video');
    if (video) {
      video.play().catch(e => console.log('Auto-play prevented:', e));
    }
  } else if (data.status === 'in_progress') {
    previewContainer.innerHTML = `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Preview</h5>
          <span class="badge bg-info">Generating</span>
        </div>
        <div class="card-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">${data.message || 'Generating preview...'}</p>
        </div>
      </div>
    `;
  } else if (data.status === 'error') {
    previewContainer.innerHTML = `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Preview</h5>
          <span class="badge bg-danger">Error</span>
        </div>
        <div class="card-body text-center py-5">
          <i class="fas fa-exclamation-circle text-danger fa-3x mb-3"></i>
          <p>${data.message || 'Failed to generate preview.'}</p>
        </div>
      </div>
    `;
  }
};
