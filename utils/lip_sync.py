import os
import subprocess
import uuid
import logging
import numpy as np
import cv2
import tempfile
import shutil

logger = logging.getLogger(__name__)

def generate_lip_sync(audio_path, avatar_id):
    """
    Generate lip-synced video using Wav2Lip
    
    Parameters:
    - audio_path: Path to the generated audio file
    - avatar_id: ID of the selected avatar
    
    Returns:
    - Path to the generated lip-synced video
    """
    try:
        # Create output directories if they don't exist
        os.makedirs("static/videos", exist_ok=True)
        os.makedirs("temp", exist_ok=True)
        
        # Generate unique identifier for this job
        job_id = str(uuid.uuid4())
        output_path = f"static/videos/lip_sync_{job_id}.mp4"
        
        # Get avatar frame path (this would be the image of the avatar to animate)
        avatar_frame_path = f"static/avatars/{avatar_id}.jpg"
        
        # Verify that the avatar frame exists
        logger.debug(f"Checking for avatar frame at {avatar_frame_path}")
        if not os.path.exists(avatar_frame_path):
            logger.warning(f"Avatar frame not found at {avatar_frame_path}")
            
            # Try alternative paths
            alternative_paths = [
                f"static/images/avatars/{avatar_id}_preview.svg",
                f"static/images/avatars/{avatar_id.replace('avatar', '')}_preview.svg" # Try without 'avatar' prefix
            ]
            
            for alt_path in alternative_paths:
                logger.debug(f"Trying alternative path: {alt_path}")
                if os.path.exists(alt_path):
                    logger.info(f"Found avatar at alternative path: {alt_path}")
                    avatar_frame_path = alt_path
                    break
        
        logger.debug(f"Generating lip sync for avatar {avatar_id} with audio {audio_path}")
        
        # In a real implementation, this would call the Wav2Lip model
        # For this implementation, we'll simulate the process
        
        # Simulated lip sync generation (placeholder for actual Wav2Lip implementation)
        # In a production environment, this would use the actual Wav2Lip model
        simulate_lip_sync(avatar_frame_path, audio_path, output_path)
        
        logger.debug(f"Lip sync generation completed. Output: {output_path}")
        
        return output_path
    
    except Exception as e:
        logger.error(f"Error in lip sync generation: {e}")
        raise

def simulate_lip_sync(avatar_frame_path, audio_path, output_path):
    """
    Simulate lip sync generation (placeholder for actual Wav2Lip implementation)
    
    In a real implementation, this would use the Wav2Lip model to generate
    a lip-synced video from the avatar frame and audio.
    """
    try:
        # Create a temporary directory for processing
        temp_dir = tempfile.mkdtemp(dir="temp")
        
        # In a real implementation, this would process the avatar frame and audio
        # using the Wav2Lip model. Here, we'll create a simple animation as a placeholder.
        
        # 1. Generate a sequence of frames (simulating lip movement)
        frame_count = 90  # 3 seconds at 30fps
        frames_dir = os.path.join(temp_dir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        
        # Load the avatar frame (or generate a placeholder)
        avatar_frame = None
        
        if os.path.exists(avatar_frame_path):
            # Check if file is an SVG
            if avatar_frame_path.lower().endswith('.svg'):
                logger.debug(f"Avatar is SVG format, creating a colored placeholder")
                # Create a placeholder with the avatar ID as text for SVG files
                avatar_frame = np.ones((480, 640, 3), dtype=np.uint8) * 240  # Light gray background
                
                # Add a colored circle for the face
                cv2.circle(
                    avatar_frame,
                    (320, 200),  # Center of the frame
                    120,         # Radius
                    (120, 180, 240),  # Light blue color
                    -1           # Filled circle
                )
                
                # Add a name from the avatar ID
                avatar_name = os.path.basename(avatar_frame_path).split('_')[0].capitalize()
                cv2.putText(
                    avatar_frame,
                    f"{avatar_name}",
                    (250, 330),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.5,
                    (60, 60, 60),
                    2
                )
            else:
                # Try to read the image
                avatar_frame = cv2.imread(avatar_frame_path)
        
        # If we couldn't load the image, create a placeholder
        if avatar_frame is None:
            # Create a placeholder frame if the avatar image doesn't exist or couldn't be loaded
            avatar_frame = np.ones((480, 640, 3), dtype=np.uint8) * 255
            # Add text to the placeholder
            cv2.putText(
                avatar_frame, 
                f"Avatar {os.path.basename(avatar_frame_path)}", 
                (50, 240), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                1, 
                (0, 0, 0), 
                2
            )
        
        # Generate frames with simulated lip movement
        for i in range(frame_count):
            # Make a copy of the frame
            frame = avatar_frame.copy()
            
            # Determine lip opening based on sine wave (simulates speaking)
            lip_opening = int(10 * np.sin(i * 0.2) + 10)
            
            # Draw a simple representation of lips
            center_x, center_y = frame.shape[1] // 2, frame.shape[0] // 2 + 50
            cv2.ellipse(
                frame, 
                (center_x, center_y), 
                (30, lip_opening), 
                0, 
                0, 
                360, 
                (150, 100, 100), 
                -1
            )
            
            # Save the frame
            frame_path = os.path.join(frames_dir, f"frame_{i:04d}.jpg")
            cv2.imwrite(frame_path, frame)
        
        # 2. Combine frames with audio to create video
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-i", os.path.join(frames_dir, "frame_%04d.jpg"),
            "-i", audio_path,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
            "-c:a", "aac",
            "-pix_fmt", "yuv420p", 
            "-shortest",
            output_path
        ]
        
        try:
            # Try to run ffmpeg
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
            logger.debug("FFMPEG process completed successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"FFMPEG error: {e.stderr.decode()}")
            # If ffmpeg fails, create a simple text file to indicate the error
            with open(output_path.replace(".mp4", ".txt"), "w") as f:
                f.write(f"Error generating video: {e}")
        
        # Clean up temporary directory
        shutil.rmtree(temp_dir)
        
    except Exception as e:
        logger.error(f"Error in simulate_lip_sync: {e}")
        raise
