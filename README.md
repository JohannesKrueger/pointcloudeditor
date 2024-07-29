# Point Cloud Editor

## Demo Link
Check out the live demo of the Point Cloud Editor [here](https://www.panoton.de/tools/pointcloud-editor/index.php).

## Highlights
- **Intuitive 3D Point Cloud Editing**: Easily visualize and manipulate 3D point clouds with simple translation and rotation tools.
- **Real-time Updates**: Immediate feedback and visualization of changes made to the point cloud.
- **Transformation Tracking**: Accurate tracking and application of all transformations to ensure consistency between visualization and exported files.
- **Support for Camera and Image Data**: Import and visualize camera and image data alongside the point cloud for a comprehensive editing experience.
- **Flexible Export Options**: Export modified point cloud and image data in the correct format for seamless integration into your workflow.
- **Cropping Editing Feature**: Crop point cloud data to focus on specific areas of interest.

![Pointcloud_Editor](https://github.com/JohannesKrueger/pointcloudeditor/assets/68600106/a7a02c22-d1b3-43a2-88e9-abf0d415b232)

## Limitations
- **Performance**: The current implementation might struggle with extremely large point cloud datasets due to browser memory constraints.
- **Limited Editing Tools**: The editor currently supports basic translation and rotation. More advanced editing features are planned for future updates.
- **Browser Compatibility**: While the tool works well in modern browsers, some older browsers may not support all features due to WebGL limitations.

## Future Work
- **Enhanced Performance**: Implementing optimizations to handle larger datasets efficiently.
- **Advanced Editing Tools**: Adding more tools for detailed editing, such as point selection, deletion, and custom transformations.
- **Extended File Format Support**: Expanding support to include more point cloud and image data formats.
- **Collaboration Features**: Enabling real-time collaborative editing of point clouds.
- **User Authentication**: Adding user authentication and personalized settings for a more tailored experience.
- **Scaling Function**: Allow users to select two points and enter the real-world distance between them to scale the entire scene accurately.

## Usage

### Prerequisites
Ensure you have a modern web browser that supports WebGL (e.g., Chrome, Firefox, Edge).

### Setup
1. Clone the repository:
    ```bash
    git clone https://github.com/JohannesKrueger/point-cloud-editor.git
    cd point-cloud-editor
    ```

2. Open `index.html` in your web browser.

### Importing Data
1. **Point Cloud Data**: Click on the "Upload Point Cloud" button and select your point cloud file (`points3D.txt`).
2. **Camera Data**: Click on the "Upload Cameras" button and select your camera file (`cameras.txt`).
3. **Image Data**: Click on the "Upload Images" button and select your images file (`images.txt`).

### Editing
1. Use the translation sliders (`X`, `Y`, `Z`) to move the point cloud.
2. Use the rotation sliders (`X`, `Y`, `Z`) to rotate the point cloud.
3. Toggle erase mode to remove unwanted points by clicking on them.
4. Use the sphere radius slider to crop the point cloud to a specific region.

### Exporting
1. Click on the "Download Points" button to export the modified point cloud data (`modifiedPoints3D.txt`).
2. If images were imported, a modified images file (`modifiedImages.txt`) will also be prepared for download.

## COLMAP Installation and Conversion

### Ensure COLMAP is installed and added to your environment variables PATH

#### Windows
```bash
colmap model_converter --input_path /path/to/input_model_folder --output_path /path/to/output_model_folder --output_type TXT
