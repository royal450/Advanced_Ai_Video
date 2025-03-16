/**
 * UI interaction handling for AI Avatar Animation
 */

// DOM elements
const themeToggle = document.getElementById('theme-toggle');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingProgressBar = document.getElementById('loading-progress-bar');

// Initialize the UI when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the theme 
  initializeTheme();
  
  // Set up event listeners
  setupEventListeners();
});

/**
 * Initialize the theme based on user preference or system setting
 */
function initializeTheme() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  
  // If theme preference exists, apply it
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    updateThemeToggleIcon(true);
  } else if (savedTheme === 'light') {
    document.body.classList.remove('dark-mode');
    updateThemeToggleIcon(false);
  } else {
    // If no saved preference, check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-mode');
      updateThemeToggleIcon(true);
    } else {
      document.body.classList.remove('dark-mode');
      updateThemeToggleIcon(false);
    }
  }
}

/**
 * Set up event listeners for interactive elements
 */
function setupEventListeners() {
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // FAQ toggle functionality
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const icon = question.querySelector('i');
      
      if (answer.style.display === 'block') {
        answer.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
      } else {
        answer.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
      }
    });
  });
  
  // Form validation
  document.querySelectorAll('.needs-validation').forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    });
  });
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  
  // Update localStorage with the new theme preference
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  
  // Update the theme toggle icon
  updateThemeToggleIcon(isDarkMode);
}

/**
 * Update the theme toggle icon based on the current theme
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
function updateThemeToggleIcon(isDarkMode) {
  if (!themeToggle) return;
  
  const icon = themeToggle.querySelector('i');
  if (!icon) return;
  
  if (isDarkMode) {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
}

/**
 * Show the loading overlay with an optional message
 * @param {string} message - Optional message to display
 */
function showLoading(message = 'Processing your avatar...') {
  if (!loadingOverlay) return;
  
  const messageEl = loadingOverlay.querySelector('.loading-text');
  if (messageEl) {
    messageEl.textContent = message;
  }
  
  // Reset the progress bar
  if (loadingProgressBar) {
    loadingProgressBar.style.width = '0%';
  }
  
  loadingOverlay.classList.remove('d-none');
}

/**
 * Hide the loading overlay
 */
function hideLoading() {
  if (!loadingOverlay) return;
  
  loadingOverlay.classList.add('d-none');
}

/**
 * Update the loading progress bar
 * @param {number} progress - Progress percentage (0-100)
 */
function updateLoadingProgress(progress) {
  if (!loadingProgressBar) return;
  
  loadingProgressBar.style.width = `${progress}%`;
  loadingProgressBar.setAttribute('aria-valuenow', progress);
}

/**
 * Display a notification/alert message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, danger, warning, info)
 * @param {number} duration - How long to display the notification in ms
 */
function showNotification(message, type = 'success', duration = 5000) {
  // Create the notification element
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show notification-toast`;
  notification.setAttribute('role', 'alert');
  
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add to the DOM
  const notificationContainer = document.querySelector('.notification-container');
  if (notificationContainer) {
    notificationContainer.appendChild(notification);
  } else {
    // Create a container if it doesn't exist
    const container = document.createElement('div');
    container.className = 'notification-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1050';
    container.appendChild(notification);
    document.body.appendChild(container);
  }
  
  // Auto-dismiss after duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 150);
  }, duration);
}

/**
 * Animate elements on scroll into view
 */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });
  
  elements.forEach(element => {
    observer.observe(element);
  });
}

// Export functions for use in other modules
window.UI = {
  showLoading,
  hideLoading,
  updateLoadingProgress,
  showNotification,
  toggleTheme
};
