# Pointcloud Editor

## Demo Link
Check out the live demo of the Pointcloud Editor [here](#).

## Highlights
- **Intuitive 3D Pointcloud Editing**: Easily visualize and manipulate 3D pointclouds with simple translation and rotation tools.
- **Real-time Updates**: Immediate feedback and visualization of changes made to the pointcloud.
- **Transformation Tracking**: Accurate tracking and application of all transformations to ensure consistency between visualization and exported files.
- **Support for Camera and Image Data**: Import and visualize camera and image data alongside the pointcloud for a comprehensive editing experience.
- **Flexible Export Options**: Export modified pointcloud and image data in the correct format for seamless integration into your workflow.

## Limitations
- **Performance**: The current implementation might struggle with extremely large pointcloud datasets due to browser memory constraints.
- **Limited Editing Tools**: The editor currently supports basic translation and rotation. More advanced editing features are planned for future updates.
- **Browser Compatibility**: While the tool works well in modern browsers, some older browsers may not support all features due to WebGL limitations.

## Future Work
- **Enhanced Performance**: Implementing optimizations to handle larger datasets efficiently.
- **Advanced Editing Tools**: Adding more tools for detailed editing, such as point selection, deletion, and custom transformations.
- **Extended File Format Support**: Expanding support to include more pointcloud and image data formats.
- **Collaboration Features**: Enabling real-time collaborative editing of pointclouds.
- **User Authentication**: Adding user authentication and personalized settings for a more tailored experience.

## Usage

### Prerequisites
Ensure you have a modern web browser that supports WebGL (e.g., Chrome, Firefox, Edge).

### Setup
1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/pointcloud-editor.git
    cd pointcloud-editor
    ```

2. Open `index.html` in your web browser.

### Importing Data
1. **Pointcloud Data**: Click on the "Upload Pointcloud" button and select your pointcloud file (`points3D.txt`).
2. **Camera Data**: Click on the "Upload Cameras" button and select your camera file (`cameras.txt`).
3. **Image Data**: Click on the "Upload Images" button and select your images file (`images.txt`).

### Editing
1. Use the translation sliders (`X`, `Y`, `Z`) to move the pointcloud.
2. Use the rotation sliders (`X`, `Y`, `Z`) to rotate the pointcloud.
3. Toggle erase mode to remove unwanted points by clicking on them.

### Exporting
1. Click on the "Download Points" button to export the modified pointcloud data (`modifiedPoints3D.txt`).
2. If images were imported, a modified images file (`modifiedImages.txt`) will also be prepared for download.

## Code Structure
The project is structured as follows:

- **index.html**: The main HTML file containing the UI structure and elements.
- **style.css**: CSS file for styling the application.
- **script.js**: JavaScript file containing the core functionality of the Pointcloud Editor.

### JavaScript Structure

#### Initialization
- **Scene Setup**: Initializes the 3D scene, camera, and renderer.
- **Controls**: Sets up the OrbitControls for navigating the 3D space.

#### Event Listeners
- **File Upload**: Handles the uploading and parsing of pointcloud, camera, and image data files.
- **Transformations**: Listeners for translation and rotation inputs to apply transformations in real-time.

#### Core Functions
- **loadPoints()**: Parses and loads the pointcloud data.
- **loadCameras()**: Parses and loads the camera data.
- **loadImages()**: Parses and processes the image data.
- **applyTranslation()**: Applies translation to the pointcloud and tracks the transformation.
- **applyRotation()**: Applies rotation to the pointcloud and tracks the transformation.
- **applyTransformations()**: Updates the transformations applied to the pointcloud and other objects in the scene.
- **renderPoints()**: Renders the pointcloud in the scene.
- **processPoints()**: Processes and exports the modified pointcloud data.

#### Helper Functions
- **logToConsole()**: Logs messages to the on-screen console.
- **coloruploaddivs()**: Updates the UI to reflect the status of uploaded files.
- **createCameraMarker()**: Creates visual markers for camera positions.
- **applySphereCrop()**: Applies a spherical crop to the pointcloud for editing.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

![Pointcloud_Editor](https://github.com/JohannesKrueger/pointcloudeditor/assets/68600106/a7a02c22-d1b3-43a2-88e9-abf0d415b232)

The in Browser Editor makes it possible to remove Points and clean the point cloud before processing the Point cloud in Colmap, Gaussian Splatting, Nerfs etc. optimizing the point cloud and archive better results and 3D reconstructions.

This Editor is compatible with the [.txt] Data exported from Colmap and runs in the browser.
