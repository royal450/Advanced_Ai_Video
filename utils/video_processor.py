import os
import logging
import uuid
import subprocess
import tempfile
import shutil
import cv2
import numpy as np

logger = logging.getLogger(__name__)

def process_video(lip_sync_path, avatar_id):
    """
    Process the lip-synced video by adding expressions, gestures, and enhancements
    
    Parameters:
    - lip_sync_path: Path to the lip-synced video
    - avatar_id: ID of the selected avatar
    
    Returns:
    - Path to the final processed video
    """
    # Generate unique identifier for this job
    job_id = str(uuid.uuid4())
    output_path = f"static/videos/final/avatar_video_{job_id}.mp4"
    
    try:
        # Create output directory if it doesn't exist
        os.makedirs("static/videos/final", exist_ok=True)
        
        logger.debug(f"Processing video for avatar {avatar_id}")
        
        # Check if input file exists
        if not os.path.exists(lip_sync_path):
            logger.error(f"Input lip sync video not found: {lip_sync_path}")
            
            # Create an error video instead
            create_error_video(output_path, avatar_id, f"Input video not found: {lip_sync_path}")
            return output_path
        
        # In a real implementation, this would add expressions, gestures, etc.
        # For this implementation, we'll simulate the process
        
        # Simulate video processing (placeholder for actual implementation)
        add_expressions_and_gestures(lip_sync_path, output_path, avatar_id)
        
        logger.debug(f"Video processing completed. Output: {output_path}")
        
        return output_path
    
    except Exception as e:
        logger.error(f"Error in video processing: {e}")
        
        try:
            # Create an error video instead
            create_error_video(output_path, avatar_id, f"Error: {str(e)}")
            return output_path
        except Exception as inner_e:
            logger.error(f"Failed to create error video: {inner_e}")
            raise e

def add_expressions_and_gestures(input_video_path, output_path, avatar_id):
    """
    Add expressions and gestures to the lip-synced video
    
    In a real implementation, this would add various expressions and hand gestures
    based on the content of the speech and the selected avatar.
    """
    try:
        # Create a temporary directory for processing
        temp_dir = tempfile.mkdtemp(dir="temp")
        frames_dir = os.path.join(temp_dir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        
        # Extract frames from the input video
        extract_cmd = [
            "ffmpeg",
            "-i", input_video_path,
            "-vf", "fps=30",
            os.path.join(frames_dir, "frame_%04d.jpg")
        ]
        
        try:
            subprocess.run(extract_cmd, check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to extract frames: {e.stderr.decode()}")
            # Fallback to creating a simpler video if ffmpeg extraction fails
            create_fallback_frames(frames_dir, avatar_id)
        
        # Get the audio from the input video
        audio_path = os.path.join(temp_dir, "audio.aac")
        extract_audio_cmd = [
            "ffmpeg",
            "-i", input_video_path,
            "-vn",
            "-acodec", "copy",
            audio_path
        ]
        
        try:
            subprocess.run(extract_audio_cmd, check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to extract audio: {e.stderr.decode()}")
            # Create a silent audio track as fallback
            create_silent_audio(audio_path)
        
        # Process the frames to add expressions and gestures
        processed_frames_dir = os.path.join(temp_dir, "processed_frames")
        os.makedirs(processed_frames_dir, exist_ok=True)
        
        # Get list of frames
        frames = sorted([f for f in os.listdir(frames_dir) if f.startswith("frame_")])
        
        # Process each frame
        for i, frame_name in enumerate(frames):
            frame_path = os.path.join(frames_dir, frame_name)
            output_frame_path = os.path.join(processed_frames_dir, frame_name)
            
            # Read the frame
            frame = cv2.imread(frame_path)
            
            if frame is not None:
                # Apply expressions and gestures based on frame index
                processed_frame = apply_expressions_and_gestures(frame, i, len(frames))
                
                # Save the processed frame
                cv2.imwrite(output_frame_path, processed_frame)
            else:
                logger.warning(f"Failed to read frame: {frame_path}")
        
        # Combine the processed frames and audio to create the final video
        combine_cmd = [
            "ffmpeg",
            "-y",
            "-i", os.path.join(processed_frames_dir, "frame_%04d.jpg"),
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
            subprocess.run(combine_cmd, check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to combine frames and audio: {e.stderr.decode()}")
        
        # Clean up temporary directory
        shutil.rmtree(temp_dir)
        
    except Exception as e:
        logger.error(f"Error in add_expressions_and_gestures: {e}")
        raise

def apply_expressions_and_gestures(frame, frame_index, total_frames):
    """
    Apply expressions and gestures to a single frame
    
    Parameters:
    - frame: The input frame
    - frame_index: The index of the current frame
    - total_frames: The total number of frames
    
    Returns:
    - The processed frame with expressions and gestures
    """
    try:
        # Make a copy of the frame
        processed_frame = frame.copy()
        
        # Calculate normalized frame position (0.0 to 1.0)
        normalized_pos = frame_index / total_frames
        
        # Simulate different expressions based on the position in the video
        if normalized_pos < 0.25:
            # Neutral expression
            pass
        elif normalized_pos < 0.5:
            # Happy expression (brighten the image slightly)
            processed_frame = cv2.addWeighted(processed_frame, 1.1, processed_frame, 0, 5)
        elif normalized_pos < 0.75:
            # Emphasis expression (increase contrast)
            processed_frame = cv2.addWeighted(processed_frame, 1.2, processed_frame, 0, 0)
        else:
            # Concluding expression (add a subtle vignette)
            height, width = processed_frame.shape[:2]
            mask = np.zeros(processed_frame.shape[:2], dtype=np.uint8)
            center = (width // 2, height // 2)
            radius = int(min(width, height) * 0.8)
            cv2.circle(mask, center, radius, 255, -1)
            mask = cv2.GaussianBlur(mask, (51, 51), 0)
            
            # Apply the vignette effect
            processed_frame = cv2.addWeighted(
                processed_frame, 1.0, 
                cv2.merge([mask, mask, mask]), -0.3, 0
            )
        
        # Add hand gesture simulation (just a simple representation)
        # In a real application, this would be more sophisticated
        if 0.4 < normalized_pos < 0.6:
            # Draw a simple hand shape
            height, width = processed_frame.shape[:2]
            hand_pos_x = int(width * 0.8)
            hand_pos_y = int(height * 0.7)
            
            # Draw a simple shape representing a hand
            cv2.circle(processed_frame, (hand_pos_x, hand_pos_y), 20, (200, 200, 200), -1)
            cv2.circle(processed_frame, (hand_pos_x+15, hand_pos_y-20), 10, (200, 200, 200), -1)
            cv2.circle(processed_frame, (hand_pos_x+30, hand_pos_y-15), 10, (200, 200, 200), -1)
            cv2.circle(processed_frame, (hand_pos_x+40, hand_pos_y-5), 10, (200, 200, 200), -1)
            cv2.circle(processed_frame, (hand_pos_x+45, hand_pos_y+10), 10, (200, 200, 200), -1)
        
        return processed_frame
    
    except Exception as e:
        logger.error(f"Error applying expressions and gestures: {e}")
        # Return original frame if processing fails
        return frame

def create_fallback_frames(frames_dir, avatar_id):
    """
    Create fallback frames if frame extraction fails
    """
    try:
        # Create 90 frames (3 seconds at 30fps)
        for i in range(90):
            # Create a blank frame
            frame = np.ones((480, 640, 3), dtype=np.uint8) * 255
            
            # Add text to the frame
            cv2.putText(
                frame, 
                f"Avatar {avatar_id}", 
                (50, 100), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                1, 
                (0, 0, 0), 
                2
            )
            
            cv2.putText(
                frame, 
                "Animated Speech", 
                (50, 200), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                1, 
                (0, 0, 0), 
                2
            )
            
            # Add animated element based on frame index
            animation_pos = int(50 + 150 * (0.5 + 0.5 * np.sin(i * 0.1)))
            cv2.circle(frame, (animation_pos, 300), 30, (0, 0, 255), -1)
            
            # Save the frame
            frame_path = os.path.join(frames_dir, f"frame_{i:04d}.jpg")
            cv2.imwrite(frame_path, frame)
    
    except Exception as e:
        logger.error(f"Error creating fallback frames: {e}")
        raise

def create_silent_audio(audio_path):
    """
    Create a silent audio track as fallback
    """
    try:
        # Create a 3-second silent audio track
        silence_cmd = [
            "ffmpeg",
            "-y",
            "-f", "lavfi",
            "-i", "anullsrc=r=44100:cl=stereo",
            "-t", "3",
            audio_path
        ]
        
        subprocess.run(silence_cmd, check=True, capture_output=True)
    
    except Exception as e:
        logger.error(f"Error creating silent audio: {e}")
        raise

def create_error_video(output_path, avatar_id, error_message):
    """
    Create a video with an error message when processing fails
    
    Parameters:
    - output_path: Path where the output video should be saved
    - avatar_id: ID of the avatar that was being processed
    - error_message: The error message to display
    """
    logger.debug(f"Creating error video for avatar {avatar_id} at {output_path}")
    
    try:
        # Create a temporary directory for processing
        temp_dir = tempfile.mkdtemp(dir="temp")
        frames_dir = os.path.join(temp_dir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        
        # Create 90 frames (3 seconds at 30fps)
        for i in range(90):
            # Create a frame with error message
            frame = np.ones((480, 640, 3), dtype=np.uint8) * 255  # White background
            
            # Draw a red border
            cv2.rectangle(frame, (20, 20), (620, 460), (0, 0, 200), 10)
            
            # Add avatar ID
            cv2.putText(
                frame, 
                f"Avatar: {avatar_id}", 
                (50, 80), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.8, 
                (0, 0, 0), 
                2
            )
            
            # Add error title
            cv2.putText(
                frame, 
                "Error Generating Video", 
                (50, 150), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                1.2, 
                (200, 0, 0), 
                2
            )
            
            # Add error message (may need to break into multiple lines)
            error_lines = []
            words = error_message.split()
            current_line = ""
            
            for word in words:
                test_line = current_line + " " + word if current_line else word
                if len(test_line) < 40:  # Max chars per line
                    current_line = test_line
                else:
                    error_lines.append(current_line)
                    current_line = word
            
            if current_line:
                error_lines.append(current_line)
            
            # Draw each line of the error message
            y_position = 200
            for line in error_lines:
                cv2.putText(
                    frame, 
                    line, 
                    (50, y_position), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.8, 
                    (0, 0, 0), 
                    1
                )
                y_position += 40
            
            # Add a pulsing "error" indicator
            pulse_size = int(30 + 10 * np.sin(i * 0.2))
            cv2.circle(frame, (320, 350), pulse_size, (0, 0, 200), -1)
            
            # Save the frame
            frame_path = os.path.join(frames_dir, f"frame_{i:04d}.jpg")
            cv2.imwrite(frame_path, frame)
        
        # Create a silent audio track
        audio_path = os.path.join(temp_dir, "silent.aac")
        create_silent_audio(audio_path)
        
        # Combine frames and audio into a video
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
            logger.debug("Error video created successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"FFMPEG error while creating error video: {e.stderr.decode()}")
            
            # Create a text file with the error if video creation fails
            with open(output_path.replace(".mp4", ".txt"), "w") as f:
                f.write(f"Error creating video: {e}\n\nOriginal error: {error_message}")
        
        # Clean up temporary directory
        shutil.rmtree(temp_dir)
    
    except Exception as e:
        logger.error(f"Error in create_error_video: {e}")
        # Create a simple text file as a last resort
        try:
            with open(output_path.replace(".mp4", ".txt"), "w") as f:
                f.write(f"Critical error creating video: {e}\n\nOriginal error: {error_message}")
        except:
            pass
        raise
