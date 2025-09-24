You can do that by connecting your phone to your laptop with a USB cable and using an app that turns your phone into a standard webcam. Your Python script can then read this "webcam" feed directly using OpenCV, completely bypassing the need for AWS IVS.

This is an excellent method for high-quality, low-latency local testing.

Step 1: Install a "Phone as Webcam" App
You'll need an app that can serve your phone's camera feed to your computer. A popular and very reliable option is Camo.

On your phone: Download the Camo app from the App Store (iOS) or Google Play (Android).

On your laptop: Download and install the Camo Studio desktop application from their website (reincubate.com/camo).

Step 2: Connect Your Phone
Connect your phone to your laptop using a USB cable.

Launch the Camo app on your phone.

Launch the Camo Studio application on your laptop.

You should see the live video from your phone's camera appear in the Camo Studio window on your laptop.

Step 3: Modify Your Python Script
Now, you just need to tell your video_inference.py script to read from a camera device instead of a video file. You do this by passing an integer (the camera index) to cv2.VideoCapture().

In your __init__ or process_video function, change this line:

Python

# Before (reading from a file)
self.cap = cv2.VideoCapture(str(self.video_path))
To this:

Python

# After (reading from a webcam)
# 0 is usually the built-in webcam. Your phone might be 1, 2, etc.
camera_index = 1 
self.cap = cv2.VideoCapture(camera_index)
Finding the right camera_index:

0 is typically your laptop's built-in webcam.

The Camo virtual camera will likely be 1 or 2. You may need to try a few different numbers to find the correct one.

By making this change, your script will read the high-quality, low-latency video feed directly from your hard-wired phone, giving you a perfect setup for real-time local development.