/**
 * Socket.io handler for real-time updates
 * Manages the WebSocket connection for real-time progress updates
 */

// Socket.io connection reference
let socket;

// Initialize Socket.IO connection
document.addEventListener('DOMContentLoaded', function() {
  initializeSocket();
});

/**
 * Initialize the Socket.IO connection
 */
function initializeSocket() {
  try {
    // Connect to the Socket.IO server (auto-connects to the host that served the page)
    socket = io();
    
    // Set up event listeners for socket events
    setupSocketListeners();
    
    console.log('Socket.IO initialized');
  } catch (error) {
    console.error('Failed to initialize Socket.IO:', error);
  }
}

/**
 * Set up listeners for socket events
 */
function setupSocketListeners() {
  // Connection established
  socket.on('connect', () => {
    console.log('Socket.IO connection established');
  });
  
  // Connection closed
  socket.on('disconnect', () => {
    console.log('Socket.IO connection closed');
  });
  
  // Connection error
  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
    window.UI?.showNotification('Connection error. Please refresh the page.', 'danger');
  });
  
  // Processing updates from the server
  socket.on('processing_update', (data) => {
    console.log('Processing update:', data);
    handleProcessingUpdate(data);
  });
  
  // Preview updates from the server
  socket.on('preview_update', (data) => {
    console.log('Preview update:', data);
    handlePreviewUpdate(data);
  });
}

/**
 * Handle processing updates from the server
 * @param {Object} data - The processing update data
 */
function handleProcessingUpdate(data) {
  const { status, message, progress, video_path } = data;
  
  // Update UI based on status
  switch (status) {
    case 'started':
      window.UI?.showLoading(message || 'Starting processing...');
      window.UI?.updateLoadingProgress(0);
      break;
      
    case 'in_progress':
      window.UI?.showLoading(message || 'Processing...');
      if (progress !== undefined) {
        window.UI?.updateLoadingProgress(progress);
      }
      break;
      
    case 'completed':
      window.UI?.hideLoading();
      if (video_path && window.VideoExport) {
        window.VideoExport.setVideoPath(video_path);
        window.VideoExport.showVideoResult();
      }
      window.UI?.showNotification('Video generated successfully!', 'success');
      break;
      
    case 'error':
      window.UI?.hideLoading();
      window.UI?.showNotification(message || 'An error occurred during processing.', 'danger');
      break;
  }
  
  // If there's a custom handler defined elsewhere, call it
  if (window.onProcessingUpdate) {
    window.onProcessingUpdate(data);
  }
}

/**
 * Handle preview updates from the server
 * @param {Object} data - The preview update data
 */
function handlePreviewUpdate(data) {
  const { status, message, preview_data } = data;
  
  // If there's a custom handler defined elsewhere, call it
  if (window.onPreviewUpdate) {
    window.onPreviewUpdate(data);
    return;
  }
  
  // Default handler if no custom handler exists
  switch (status) {
    case 'in_progress':
      window.UI?.showLoading(message || 'Generating preview...');
      break;
      
    case 'completed':
      window.UI?.hideLoading();
      if (preview_data && preview_data.preview_url) {
        // Update preview if there's a function to do so
        if (window.updatePreview) {
          window.updatePreview(preview_data.preview_url);
        }
      }
      break;
      
    case 'error':
      window.UI?.hideLoading();
      window.UI?.showNotification(message || 'Failed to generate preview.', 'danger');
      break;
  }
}

/**
 * Request a preview from the server
 * @param {Object} data - Data required for preview generation
 */
function requestPreview(data) {
  if (!socket || !socket.connected) {
    console.error('Socket not connected, cannot request preview');
    window.UI?.showNotification('Connection error. Please refresh the page.', 'danger');
    return;
  }
  
  try {
    socket.emit('preview_request', data);
    console.log('Preview requested:', data);
  } catch (error) {
    console.error('Error requesting preview:', error);
    window.UI?.showNotification('Failed to request preview.', 'danger');
  }
}

// Export functions for use in other modules
window.SocketHandler = {
  requestPreview,
  getSocket: () => socket
};
