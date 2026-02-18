# User Guide - EyeTrain1

Welcome to EyeTrain1! This guide will help you get started with converting photos to 3D models, rigging, and applying motion capture.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Photo to 3D Conversion](#photo-to-3d-conversion)
3. [Uploading 3D Models](#uploading-3d-models)
4. [Applying Motion Capture](#applying-motion-capture)
5. [Using Unreal Engine Models](#using-unreal-engine-models)
6. [Tips & Best Practices](#tips--best-practices)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Application
1. Open your web browser
2. Navigate to `http://localhost:3000` (or your deployment URL)
3. You'll see the main dashboard with four tabs

### Interface Overview
- **Photo to 3D**: Convert photos to 3D models
- **Upload Model**: Upload existing 3D models for rigging
- **Motion Capture**: Apply animations to rigged models
- **Unreal Models**: Browse and use default Unreal Engine models

## Photo to 3D Conversion

### Step 1: Upload a Photo
1. Click on the **"Photo to 3D"** tab
2. You'll see a drop zone
3. Either:
   - Drag and drop a photo into the drop zone
   - Click the drop zone to select a file from your computer

### Step 2: Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)

### Step 3: Monitor Progress
- After uploading, you'll see a progress bar
- The conversion process typically takes 30-60 seconds
- Progress is shown as a percentage

### Step 4: View Your Model
- Once complete, you'll see a success message
- Your new 3D model will appear in the "Your Models" section below
- If the model is humanoid, it will be automatically rigged

### Best Practices for Photo Conversion
✅ **DO:**
- Use clear, well-lit photos
- Ensure the subject is fully visible
- Use high-resolution images (at least 1024x1024)
- Keep file size under 50MB

❌ **DON'T:**
- Use blurry or low-quality images
- Upload photos with heavy filters
- Use images with multiple overlapping subjects

## Uploading 3D Models

### Step 1: Prepare Your Model
Supported formats:
- FBX (.fbx) - Recommended for Unreal Engine
- OBJ (.obj)
- GLTF (.gltf)
- GLB (.glb)
- Collada (.dae)

### Step 2: Upload
1. Click on the **"Upload Model"** tab
2. Drag and drop your model file or click to select
3. The system will automatically analyze your model

### Step 3: Automatic Analysis
The system will:
- Detect if the model is humanoid
- Check the model structure
- Begin rigging process if humanoid

### Step 4: Rigging (Humanoid Models)
For humanoid models:
- Automatic skeleton detection
- UE4/UE5 compatible rigging
- 67-bone skeleton structure
- Takes approximately 20-30 seconds

### Non-Humanoid Models
- Will be uploaded and stored
- Can still be used in your projects
- Motion capture won't be available

## Applying Motion Capture

### Prerequisites
- You must have at least one rigged model
- Motion capture data in BVH or FBX format

### Step 1: Select a Rigged Model
1. Click on the **"Motion Capture"** tab
2. Use the dropdown to select a rigged model
3. Only models with ✅ Rigged status will appear

### Step 2: Upload Motion Data
1. After selecting a model, you'll see the upload area
2. Drag and drop or select your motion file
3. Supported formats:
   - BVH (.bvh) - Common mocap format
   - FBX (.fbx) - With animation data

### Step 3: Processing
The system will:
- Validate the motion data
- Check compatibility with your model's skeleton
- Retarget the animation if necessary
- Apply the motion to your model

### Step 4: View Results
Once complete, you'll see:
- Animation duration
- Frame rate (FPS)
- Total number of frames
- Options to preview or export

### Motion Capture Tips
✅ **Tips:**
- Use motion data from reputable sources
- Ensure the skeleton structure matches
- BVH format is most widely compatible
- Test with shorter animations first

## Using Unreal Engine Models

### Available Models
1. **UE Mannequin**
   - Standard Unreal Engine humanoid
   - Full UE4/UE5 skeleton
   - Perfect for testing
   - Ready for motion capture

2. **UE Female Character**
   - Female character base mesh
   - UE4/UE5 compatible
   - Pre-rigged and ready to use

3. **UE Male Character**
   - Male character base mesh
   - UE4/UE5 compatible
   - Pre-rigged and ready to use

### Using Default Models
1. Click on **"Unreal Models"** tab
2. Browse available models
3. Click "Use This Model" to add to your library
4. Click "Preview" to see the model
5. Apply motion capture as with your own models

### Benefits
- No upload time
- Pre-rigged and tested
- Guaranteed Unreal Engine compatibility
- Great for prototyping

## Tips & Best Practices

### File Management
- Keep original files backed up
- Use descriptive filenames
- Organize models by project
- Regularly export completed work

### Performance
- Close unnecessary browser tabs
- Use recommended file formats
- Keep files under size limits
- Clear browser cache if issues occur

### Quality
- Higher resolution = better results
- Clean geometry works best
- Use proper lighting in photos
- Test with simple models first

### Workflow
1. Start with default UE models to understand the process
2. Convert simple photos before complex ones
3. Test motion capture with short animations
4. Export and verify in your 3D software

## Troubleshooting

### Upload Issues

**Problem: File won't upload**
- Check file size (max 50MB)
- Verify file format is supported
- Try a different browser
- Check internet connection

**Problem: Upload stuck at 0%**
- Refresh the page
- Try a smaller file first
- Check browser console for errors

### Conversion Issues

**Problem: Photo conversion fails**
- Ensure photo is clear and well-lit
- Try a different image format
- Reduce image size if very large
- Check that subject is visible

**Problem: Model not detected as humanoid**
- Verify it actually is a humanoid model
- Check the model structure
- Try converting to FBX format
- Ensure limbs and body are distinct

### Motion Capture Issues

**Problem: Motion won't apply**
- Verify model is rigged
- Check motion file format
- Ensure skeleton compatibility
- Try a different motion file

**Problem: Animation looks wrong**
- Motion may be for different skeleton type
- Try BVH format instead
- Check the original motion data
- Verify model rigging is correct

### General Issues

**Problem: Application is slow**
- Close other browser tabs
- Clear browser cache
- Check internet speed
- Refresh the page

**Problem: Can't see my models**
- Click the "Refresh" button
- Check browser console for errors
- Verify uploads completed
- Clear browser cache

## Getting Help

### Resources
- Check the [API Documentation](API.md)
- Read the [README](README.md)
- Review [Contributing Guidelines](CONTRIBUTING.md)

### Support
- Open an issue on GitHub
- Check existing issues for solutions
- Provide detailed error descriptions
- Include screenshots when helpful

## Keyboard Shortcuts

Currently no keyboard shortcuts are implemented, but coming soon:
- `Ctrl/Cmd + U` - Upload file
- `Ctrl/Cmd + R` - Refresh models
- `Ctrl/Cmd + E` - Export current model

## Next Steps

1. **Experiment** with the platform
2. **Try** different types of photos and models
3. **Explore** motion capture options
4. **Export** your creations
5. **Share** your feedback

---

**Happy Creating! 🎨🎯**
