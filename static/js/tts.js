/**
 * Text-to-Speech functionality
 * Handles TTS requests and audio playback
 */

// Keep track of audio elements and their sources
let audioElements = {};

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  setupTTSListeners();
});

/**
 * Set up listeners for TTS-related UI elements
 */
function setupTTSListeners() {
  // Listen for TTS test buttons
  document.querySelectorAll('.test-voice-btn').forEach(button => {
    button.addEventListener('click', function() {
      const voiceId = this.getAttribute('data-voice-id');
      const sampleText = this.getAttribute('data-sample-text') || 'This is a sample of how this voice sounds.';
      
      // Generate and play TTS
      generateAndPlayTTS(voiceId, sampleText);
    });
  });
}

/**
 * Generate TTS audio and play it
 * @param {string} voice - The voice ID to use
 * @param {string} text - The text to convert to speech
 */
function generateAndPlayTTS(voice, text) {
  // Check if we have valid inputs
  if (!voice || !text) {
    console.error('Voice and text are required for TTS');
    window.UI?.showNotification('Voice and text are required for TTS', 'danger');
    return;
  }
  
  // Show loading state on button if possible
  const button = document.querySelector(`.test-voice-btn[data-voice-id="${voice}"]`);
  if (button) {
    const originalText = button.textContent;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
    button.disabled = true;
  }
  
  // Make API request to generate speech
  fetch('/api/generate-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, voice })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.audio_path) {
        playTTSAudio(voice, data.audio_path);
      } else {
        throw new Error(data.error || 'Unknown error generating speech');
      }
    })
    .catch(error => {
      window.UI?.showNotification(`Error: ${error.message}`, 'danger');
      console.error('TTS error:', error);
    })
    .finally(() => {
      // Reset button state
      if (button) {
        button.innerHTML = originalText || 'Test Voice';
        button.disabled = false;
      }
    });
}

/**
 * Play the generated TTS audio
 * @param {string} voiceId - The voice ID that generated the audio
 * @param {string} audioPath - The path to the audio file
 */
function playTTSAudio(voiceId, audioPath) {
  // If we already have an audio element for this voice, stop and remove it
  if (audioElements[voiceId]) {
    audioElements[voiceId].pause();
    audioElements[voiceId].removeAttribute('src');
    audioElements[voiceId].load();
  }
  
  // Create a new audio element
  const audio = new Audio(audioPath);
  
  // Set up event listeners
  audio.addEventListener('ended', () => {
    // Clean up when audio finishes
    delete audioElements[voiceId];
    
    // Reset any UI elements if needed
    const button = document.querySelector(`.test-voice-btn[data-voice-id="${voiceId}"]`);
    if (button) {
      button.innerHTML = 'Test Voice';
      button.disabled = false;
    }
  });
  
  audio.addEventListener('error', (e) => {
    console.error('Audio playback error:', e);
    window.UI?.showNotification('Error playing audio', 'danger');
    
    // Clean up
    delete audioElements[voiceId];
    
    // Reset any UI elements
    const button = document.querySelector(`.test-voice-btn[data-voice-id="${voiceId}"]`);
    if (button) {
      button.innerHTML = 'Test Voice';
      button.disabled = false;
    }
  });
  
  // Store the audio element
  audioElements[voiceId] = audio;
  
  // Play the audio
  audio.play()
    .catch(error => {
      console.error('Error playing audio:', error);
      window.UI?.showNotification('Error playing audio. Please try again.', 'danger');
    });
}

// Export functions for use in other modules
window.TTS = {
  generateAndPlayTTS,
  playTTSAudio
};
