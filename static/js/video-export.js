/**
 * Video export functionality for AI Avatar Animation
 * Handles final video download and sharing options
 */

// Video state management
let videoState = {
  videoPath: null,
  videoReady: false,
  videoFormat: 'mp4',
  videoQuality: 'high'
};

// DOM Elements
let videoResultContainer;
let videoDownloadBtn;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  videoResultContainer = document.getElementById('video-result');
  videoDownloadBtn = document.getElementById('download-video-btn');
  
  // Set up event listeners
  setupExportListeners();
});

/**
 * Set up event listeners for export-related UI elements
 */
function setupExportListeners() {
  // Download button
  if (videoDownloadBtn) {
    videoDownloadBtn.addEventListener('click', downloadVideo);
  }
  
  // Video format selection
  document.querySelectorAll('input[name="video-format"]').forEach(input => {
    input.addEventListener('change', function() {
      videoState.videoFormat = this.value;
      console.log(`Video format set to: ${videoState.videoFormat}`);
    });
  });
  
  // Video quality selection
  document.querySelectorAll('input[name="video-quality"]').forEach(input => {
    input.addEventListener('change', function() {
      videoState.videoQuality = this.value;
      console.log(`Video quality set to: ${videoState.videoQuality}`);
    });
  });
  
  // Share buttons
  document.querySelectorAll('.share-btn').forEach(button => {
    button.addEventListener('click', function() {
      const platform = this.getAttribute('data-platform');
      shareVideo(platform);
    });
  });
}

/**
 * Set the path to the generated video
 * @param {string} path - The path to the video file
 */
function setVideoPath(path) {
  videoState.videoPath = path;
  videoState.videoReady = true;
  
  // Enable download button if it exists
  if (videoDownloadBtn) {
    videoDownloadBtn.disabled = false;
  }
}

/**
 * Show the video result in the designated container
 */
function showVideoResult() {
  if (!videoResultContainer || !videoState.videoPath) return;
  
  videoResultContainer.innerHTML = `
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Your Avatar Video</h5>
        <span class="badge bg-success">Ready</span>
      </div>
      <div class="card-body p-0">
        <video id="result-video" controls class="w-100">
          <source src="${videoState.videoPath}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
      <div class="card-footer">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <button class="btn btn-primary" id="download-video-btn">
              <i class="fas fa-download me-1"></i> Download
            </button>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary share-btn" data-platform="facebook">
              <i class="fab fa-facebook-f"></i>
            </button>
            <button class="btn btn-outline-primary share-btn" data-platform="twitter">
              <i class="fab fa-twitter"></i>
            </button>
            <button class="btn btn-outline-primary share-btn" data-platform="linkedin">
              <i class="fab fa-linkedin-in"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Export Options</h5>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-6">
            <h6>Video Format</h6>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="video-format" id="format-mp4" value="mp4" checked>
              <label class="form-check-label" for="format-mp4">MP4</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="video-format" id="format-webm" value="webm">
              <label class="form-check-label" for="format-webm">WebM</label>
            </div>
          </div>
          <div class="col-md-6">
            <h6>Quality</h6>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="video-quality" id="quality-high" value="high" checked>
              <label class="form-check-label" for="quality-high">High (1080p)</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="video-quality" id="quality-medium" value="medium">
              <label class="form-check-label" for="quality-medium">Medium (720p)</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="video-quality" id="quality-low" value="low">
              <label class="form-check-label" for="quality-low">Low (480p)</label>
            </div>
          </div>
        </div>
        
        <div class="mb-3">
          <h6>Additional Exports</h6>
          <div class="export-options">
            <div class="export-option">
              <i class="fas fa-file-audio"></i>
              <div>Audio Only</div>
              <small class="text-muted d-block">MP3 Format</small>
            </div>
            <div class="export-option">
              <i class="fas fa-file-image"></i>
              <div>Thumbnail</div>
              <small class="text-muted d-block">PNG Format</small>
            </div>
            <div class="export-option">
              <i class="fas fa-film"></i>
              <div>GIF Animation</div>
              <small class="text-muted d-block">Looping GIF</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Reinitialize listeners for the new elements
  const newDownloadBtn = document.getElementById('download-video-btn');
  if (newDownloadBtn) {
    newDownloadBtn.addEventListener('click', downloadVideo);
  }
  
  // Reinitialize share buttons
  videoResultContainer.querySelectorAll('.share-btn').forEach(button => {
    button.addEventListener('click', function() {
      const platform = this.getAttribute('data-platform');
      shareVideo(platform);
    });
  });
  
  // Reinitialize format and quality radio buttons
  videoResultContainer.querySelectorAll('input[name="video-format"]').forEach(input => {
    input.addEventListener('change', function() {
      videoState.videoFormat = this.value;
    });
  });
  
  videoResultContainer.querySelectorAll('input[name="video-quality"]').forEach(input => {
    input.addEventListener('change', function() {
      videoState.videoQuality = this.value;
    });
  });
  
  // Export options
  videoResultContainer.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', function() {
      window.UI?.showNotification('This export option will be available soon!', 'info');
    });
  });
  
  // Auto-scroll to the result and play the video
  videoResultContainer.scrollIntoView({ behavior: 'smooth' });
  
  // Auto-play the video
  const video = document.getElementById('result-video');
  if (video) {
    video.play().catch(e => console.log('Auto-play prevented:', e));
  }
}

/**
 * Download the generated video
 */
function downloadVideo() {
  if (!videoState.videoPath) {
    window.UI?.showNotification('No video available to download', 'warning');
    return;
  }
  
  try {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = videoState.videoPath;
    a.download = `avatar-video-${Date.now()}.${videoState.videoFormat}`;
    a.style.display = 'none';
    
    // Add to the DOM, trigger click, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    window.UI?.showNotification('Video download started!', 'success');
  } catch (error) {
    console.error('Error downloading video:', error);
    window.UI?.showNotification('Error downloading video', 'danger');
    
    // Fallback: Open in new tab
    window.open(videoState.videoPath, '_blank');
  }
}

/**
 * Share the video to social media
 * @param {string} platform - The platform to share to (facebook, twitter, linkedin)
 */
function shareVideo(platform) {
  if (!videoState.videoPath) {
    window.UI?.showNotification('No video available to share', 'warning');
    return;
  }
  
  // In a real application, we would use the actual sharing APIs or URLs
  // For this demo, we'll just show a notification
  window.UI?.showNotification(`Sharing to ${platform} will be available soon!`, 'info');
  
  // Example of how sharing would work in a real application:
  /*
  const shareUrl = window.location.origin + videoState.videoPath;
  let shareLink = '';
  
  switch (platform) {
    case 'facebook':
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      break;
    case 'twitter':
      shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out my AI Avatar video!')}`;
      break;
    case 'linkedin':
      shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      break;
  }
  
  window.open(shareLink, '_blank');
  */
}

// Export functions for use in other modules
window.VideoExport = {
  setVideoPath,
  showVideoResult,
  downloadVideo
};
