/**
 * Main JavaScript file for AI Avatar Animation
 * Handles global functionality and initialization
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI animations
  initializeAnimations();
  
  // Initialize avatar showcases on the home page
  initializeAvatarShowcase();
  
  // Smooth scrolling for anchor links
  initializeSmoothScrolling();
});

/**
 * Initialize animations for interactive elements
 */
function initializeAnimations() {
  // Animate the waveform bars
  const waveformBars = document.querySelectorAll('.waveform-bar');
  waveformBars.forEach((bar, index) => {
    bar.style.animationDelay = `${index * 0.2}s`;
  });
  
  // Animate elements on scroll
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  
  if (animateElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    animateElements.forEach(element => {
      observer.observe(element);
    });
  }
}

/**
 * Initialize avatar showcase on the home page
 */
function initializeAvatarShowcase() {
  const showcaseContainer = document.querySelector('.avatar-showcase');
  if (!showcaseContainer) return;
  
  // Fetch avatar data
  fetch('/api/avatars')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch avatars');
      }
      return response.json();
    })
    .then(data => {
      if (data && data.avatars && data.avatars.length > 0) {
        // Only display a limited number for the showcase
        const showcaseAvatars = data.avatars.slice(0, 12);
        
        // Clear existing placeholders
        showcaseContainer.innerHTML = '';
        
        // Add avatars to the showcase
        showcaseAvatars.forEach(avatar => {
          const avatarElement = createAvatarElement(avatar);
          showcaseContainer.appendChild(avatarElement);
        });
      }
    })
    .catch(error => {
      console.error('Error loading avatars:', error);
    });
}

/**
 * Create an avatar element for the showcase
 * @param {Object} avatar - The avatar data
 * @returns {HTMLElement} - The avatar element
 */
function createAvatarElement(avatar) {
  const element = document.createElement('div');
  element.className = 'avatar-preview shadow-sm';
  element.setAttribute('data-avatar-id', avatar.id);
  
  // Determine the image source
  const imageSrc = avatar.preview || `/static/images/avatars/${avatar.id}_preview.svg`;
  
  element.innerHTML = `
    <div class="ratio ratio-1x1">
      <img src="${imageSrc}" alt="${avatar.name}" onerror="this.onerror=null; this.src='/static/images/avatar-placeholder.svg';">
    </div>
    <div class="p-2 small text-center">${avatar.name}</div>
  `;
  
  // Add click event to redirect to avatar creation
  element.addEventListener('click', () => {
    window.location.href = `/avatar?selected=${avatar.id}`;
  });
  
  return element;
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for fixed header
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Toggle FAQ answers
 * @param {HTMLElement} element - The FAQ question element
 */
function toggleFAQ(element) {
  const answer = element.nextElementSibling;
  const icon = element.querySelector('i');
  
  if (answer.style.display === 'block') {
    answer.style.display = 'none';
    icon.className = 'fas fa-chevron-down';
  } else {
    answer.style.display = 'block';
    icon.className = 'fas fa-chevron-up';
  }
}

// Make toggleFAQ globally available for use in inline event handlers
window.toggleFAQ = toggleFAQ;
