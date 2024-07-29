<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="shortcut icon" type="image/x-icon" href="../../img/favicon.ico" />
    <meta name="Description" content="Point cloud Editor – Edit, Crop and Clear Point Clouds in Browser Tool - Panoton"/>
    <meta name="Keyword" content="Point cloud Editor, colmap, gaussian splatting, pointcloud, editor"/>
    <meta name="author" content="Point cloud Editor in Browser"/>
    <meta name="rating" CONTENT="General"/>
    <meta content="all" name="Googlebot-Image"/>
    <meta content="all" name="Slurp"/>
    <meta content="all" name="Scooter"/>
    <meta content="ALL" name="WEBCRAWLERS"/>
    <meta name="revisit-after" CONTENT="2 days"/>
    <meta name="robots" content="ALL, index, follow"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Point cloud Editor in Browser</title>

  <style>
    .settings > * {
      margin-top: 12px;
      margin-bottom: 12px;
    }
    #cubemap {
      position: relative;
      border: 2px solid #015DE4;
      background: #eee;
      margin-top: 15px;
    }
    #panorama {
      width: 161px;
      height: 120px;
      position: relative;
      border: 2px solid #015DE4;
      background: #eee;
      margin-top: 15px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #imageInput {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
      background-color : #d1d1d1;
    }
    #output {
      max-width: 100%;
      max-height: 100%;
      z-index: 0;
    }
    .img_container {
      width: 100%;
      height: 600px;
      background: aqua;
      margin: auto;
      padding: 10px;
    }
    #loading-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        z-index: 1000;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    #loading-spinner {
        border: 16px solid #f3f3f3;
        border-top: 16px solid #3498db;
        border-radius: 50%;
        width: 120px;
        height: 120px;
        animation: spin 2s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    #loading-message {
        margin-top: 20px;
        font-size: 18px;
        color: #333;
    }

    progress {
        width: 80%;
        height: 20px;
        margin: 10px 0;
    }

  </style>
</head>

<body>
    <section style="padding-top: 4%; margin-bottom:4%">
        <div class="container" style="margin-top: 0%;">
            <div class="row">
                <div class="col-lg-6">
                    <div class="section-title">
                        <h1>Point cloud Editor<a href="https://github.com/JohannesKrueger/pointcloudeditor" target="_blank"><img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" class="github-logo"></a></h1>
                        <a href="#tutorial"class="tutorial-link">(Tutorial)</a>
                    </div>
                    <p>The Free Point cloud Editor allows you to edit, crop and export any Point cloud files with a userfriendly Interface. This makes it possible to remove Points and clean the point cloud before processing the Point cloud in Colmap, Gaussian Splatting, Nerfs etc. optimizing the point cloud and archive better results and 3D reconstructions. Your can also translate and rotate Colmap Pointclouds and export the adjusted images.txt and points3D.txt.</p>
                    <p>This opensource Editor is compatible with the [.txt] Data exported from Colmap reconstructions and runs in the browser.</p>       
                </div>
                <div class="col-lg-6">
                    <img src="../../img/Pointcloud-Editor.webp" alt="Point cloud editor - Panoton" width="100%" height="100%" loading="lazy">
                </div>
            </div>
        </div>
    </section>

    <script src="script.js"></script>
    <main>
        <div id="rendererContainer" style="position: relative; width: auto; height: auto; border: 5px solid #015DE4;">
            <div id="button-container">
                <h2>Import</h2>
                <div id="upload-container" class="pointcloudupload">
                    <label for="pointcloudUpload" class="upload-label">
                        Upload Point cloud File
                        <input type="file" id="pointcloudUpload" accept=".txt" />
                    </label>
                </div>
                
                <div id="upload-container" class="camerasandimagesupload">
                    <div id="upload-cameras-container">
                        <label for="camerasUpload">
                            Upload Cameras File:
                            <input type="file" id="camerasUpload" accept=".txt" />
                        </label>
                    </div>

                    <div id="upload-images-container">
                        <label for="imagesUpload">
                            Upload Images File:
                            <input type="file" id="imagesUpload" accept=".txt" />
                        </label>
                    </div>
                </div>

                <div class="section">
                    <h2>Remove Points</h2>
                    <div class="flex-row">
                        <span>Toggle Eraser</span>
                        <label class="switch">
                            <input type="checkbox" id="toggleEraseMode">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="flex-row"> <!-- Use flex-row for horizontal alignment -->
                        <label for="sphereRadius">Crop Radius:</label>
                        <input type="range" id="sphereRadius" min="0.5" max="100" value="50" step="0.5">
                        <span style="float:right; text-align: right;" id="radiusValue">50</span>
                    </div>
                    <div id="controls-container">
                        <div>
                            <h3>Translate</h3>
                            <div class="control-group">
                                <label for="translateX">X-axis:</label>
                                <input type="number" id="translateX" value="0" step="0.1" onchange="applyTranslation()">
                            </div>
                            <div class="control-group">
                                <label for="translateY">Y-axis:</label>
                                <input type="number" id="translateY" value="0" step="0.1" onchange="applyTranslation()">
                            </div>
                            <div class="control-group">
                                <label for="translateZ">Z-axis:</label>
                                <input type="number" id="translateZ" value="0" step="0.1" onchange="applyTranslation()">
                            </div>
                        </div>
                        <div>
                            <h3 style="margin-top: 5%">Rotate</h3>
                            <div class="control-group">
                                <label for="rotateX">X-axis:</label>
                                <input type="number" id="rotateX" value="0" step="1" onchange="applyRotation()">
                            </div>
                            <div class="control-group">
                                <label for="rotateY">Y-axis:</label>
                                <input type="number" id="rotateY" value="0" step="1" onchange="applyRotation()">
                            </div>
                            <div class="control-group">
                                <label for="rotateZ">Z-axis:</label>
                                <input type="number" id="rotateZ" value="0" step="1" onchange="applyRotation()">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="export-container">
                    <h2>Export</h2>
                    <button style="width: 97.5%;" id="downloadPoints">Download</button>
            </div>
            <div id="console-container">
                <h2>Console</h2>
                <div id="console-output" style="width: 100%; height: 200px; overflow-y: scroll; background-color: #f4f4f4; border: 1px solid #ccc; padding: 5px; box-sizing: border-box;"></div>
            </div>
        </div>
    </main>

    <div id="loading-overlay">
        <div id="loading-spinner"></div>
        <div id="loading-message">Processing Data... This might take a few seconds depending on the file size</div>
        <div>
            <p>Processing Points3D</p>
            <progress id="points-progress" value="0" max="100"></progress>
        </div>
        <div>
            <p>Processing Images</p>
            <progress id="images-progress" value="0" max="100"></progress>
        </div>
    </div>

  <main>
    <div class="container">
        <div class="footer__top">
            <div id="tutorial" class="row">
                <div class="section-title" style="width: 100%; margin-top: 5%">
                    <h2>Tutorial</h2>
                </div>
                <div class="col-lg-4 col-md-4">
                  <legend>Upload Point cloud</legend>
                  <p>At first, upload a Point cloud file in [.txt] format (For Example the points3D.txt from Colmap) to the "Input" field. If you want to rotate or translate the pointcloud make sure to import the cameras.txt and images.txt file as well to copy the same rotations and translations as the pointcloud. Loading the files in the Scene might take a few seconds depending on the file size.</p>
                </div>
                <div class="col-lg-4 col-md-4">
                  <legend>Edit</legend>
                  <p>In the Settings area you can make changes to the Point cloud. Rotate and Translate it with left and right click. Edit the Point cloud by adjusting the Sphere Crop Radius and manually remove points with the Eraser Tool. All removed Points are colored in Red. Translate and Rotate the Colmap Scene by changing the Values of the Translation and Rotation.</p>
                </div>
                  <div class="col-lg-4 col-md-4">
                  <legend>Download</legend>
                  <p>You can download the edited Point cloud file in [.txt] format without the Red colored Points directly by clicking the download button. Depending on the size of your imported Data, this might take a few seconds to apply and write the modified filed. Make sure to rename the downloaded Files correcly to (points3D.txt or images.txt) to be recognized by Colmap</p>
                </div>   
            </div>
        </div>
    </div>
  </main>

<style>
    #rendererContainer {
        position: relative; /* Ensures absolute positioning inside it is relative to this container */
        width: auto; /* or specific dimensions as needed */
        height: auto; /* or specific dimensions as needed */
    }

    #button-container {
        width: 25%;
        position: absolute;
        top: 1%;
        left: 1%;
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 10px;
        padding: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        opacity: 0.9;
    }

    #console-container {
        width: 25%;
        position: absolute;
        bottom: 1%;
        right: 1%;
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 10px;
        padding: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        opacity: 0.9;
    }

    #console-output {
        height: 200px;
        overflow-y: auto;
        background-color: #f4f4f4;
        border: 1px solid #ccc;
        padding: 10px;
        box-sizing: border-box;
        font-family: monospace;
    }

    #export-container {
        width: 25%;
        position: absolute;
        top: 1%;
        right: 1%;
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 10px;
        padding: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        opacity: 0.9;
    }

    .section-title h1 {
        display: flex;
        align-items: center; /* Aligns the text and image vertically centered */
        white-space: nowrap; /* Prevents the title from wrapping */
    }

    .github-logo {
        width: 32px; /* Adjusts the size of the GitHub logo */
        height: auto;
        margin-left: 10px; /* Space between the text and the logo */
    }

    button {
        padding: 10px 20px;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s, color 0.3s;
        margin: 5px; /* Add margin between buttons */
    }

    button:hover {
        background-color: #f8f8f8;
        color: #000;
    }

    #controls-container > div {
        display: grid;
        grid-template-columns: repeat(3, 1fr); /* Three columns of equal width */
        gap: 10px; /* Space between each control */
        align-items: center; /* Align items vertically */
    }

    .control-group {
        display: flex;
        flex-direction: column; /* Stack label and input vertically */
        gap: 5px; /* Space between label and input */
    }

    .control-group label, 
    .control-group input {
        width: 100%; /* Full width of their container */
    }

    #translateX, #translateY, #translateZ, 
    #rotateX, #rotateY, #rotateZ {
        width: calc(100% - 20px); /* Full width minus padding */
        padding: 5px; /* Padding for better touch target */
    }

    #button-container h3 {
        grid-column: span 3; /* Header spans all 3 columns */
        text-align: center; /* Center align the section headers */
    }

    #controls-container {
        margin-top: 10px; /* Space above controls container */
    }

    /* Styling adjustments for inputs to improve UI */
    input[type="number"] {
        border: 2px solid #ddd; /* Subtle border */
        border-radius: 4px; /* Rounded borders for inputs */
    }


    #upload-container {
        width: 90%;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(1, 93, 228, 0.5);
        margin-bottom: 10px; /* Creates space between this container and the buttons */
    }

    .upload-label {
        font-size: 16px;
        color: #333;
        padding: 10px 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 10px;
    }

    .upload-btn {
        background-color: #015de4;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
    }

    #file-chosen {
        color: #888;
    }

    .flex-row {
        display: flex;
        align-items: center; /* Aligns items vertically in the center */
        justify-content: flex-start; /* Aligns items to the left */
        gap: 10px; /* Space between elements */
    }

    .switch {
        display: flex;
        align-items: center;
        position: relative;
        width: 60px;
        height: 34px;
        margin-left: 10px; /* Space between the text and the switch */
    }

    .switch input { 
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: #2196F3;
    }

    input:checked + .slider:before {
        transform: translateX(26px);
    }

    .slider:active:before {
        width: 30px;
    }

    .upload-label {
        display: block;
        cursor: pointer;
        margin-bottom: 20px; /* Spacing between upload and editing tools */
    }

    button {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    button:hover {
        background-color: #0056b3;
    }

    .range-slider input[type="range"] {
        width: 50px; /* Slider takes the full width of its container */
        height: 8px; /* Sets a fixed height for the slider */
        background: #015DE4; /* Background color for the slider */
        outline: none; /* Removes the outline */
        opacity: 0.7; /* Slightly transparent */
        transition: opacity .2s; /* Transition for hover effect */
    }

    .range-slider input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; /* Removes default webkit styles for the thumb */
        appearance: none;
        width: 20px; /* Width of the thumb */
        height: 20px; /* Height of the thumb */
        background: white; /* Background color for the thumb */
        cursor: pointer; /* Pointer cursor on hover */
        border-radius: 50%; /* Makes the thumb circular */
    }
        
    /* Styling for the range slider */
    #sphereRadius {
        -webkit-appearance: none; /* Override default appearance for WebKit */
        width: 150px; /* Full width to fit container */
        background: transparent; /* Clear default background */
        outline: none; /* Remove default outline */
    }

    /* Style for the slider thumb */
    #sphereRadius::-webkit-slider-thumb {
        text-align: left;
        -webkit-appearance: none; /* Remove default style */
        appearance: none;
        width: 20px; /* Set the width of the thumb */
        height: 20px; /* Set the height of the thumb */
        background: #015DE4; /* Blue background color */
        cursor: pointer; /* Cursor appears as pointer */
        border-radius: 50%; /* Circular shape */
        border: 2px solid white; /* White border around the thumb */
    }

    /* Style for the slider track */
    #sphereRadius::-webkit-slider-runnable-track {
        text-align: left;
        width: 100px; /* Full width */
        height: 8px; /* Track height */
        background: #015DE4; /* Blue background color */
        border-radius: 4px; /* Slightly rounded corners for the track */
    }
    
    .tutorial-link:hover {
        color: #015DE4; /* Changes color on hover */
    }

    .code-container {
        display: flex;
        font-family: monospace;
    }

    .line-numbers, .code-lines {
        list-style-type: none; /* Removes default list bullet points */
        margin: 0;
        padding: 0;
    }

    .line-numbers {
        background-color: #f3f3f3;
        color: #888;
        padding-right: 10px;
        text-align: right; /* Right-align the line numbers */
    }

    .code-lines {
        background-color: #fff;
        color: #333;
        padding-left: 10px; /* Ensures some space between line numbers and code */
        border-left: 1px solid #ccc; /* Adds a visual separator */
    }
</style>

   <section >
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <div class="section-title">
                        <span>Need Help?</span>
                        <h2>FAQ</h2>
                    </div>
                    <div class="services__item">
                        <div class="faq">
                            <details>
                                <summary class= "faq-sum faq-text">What's the correct Input Point cloud file format?</summary>
                                <p class= "faq-text" >The imported point cloud file must be in [.txt] format. Make sure to only import the point cloud file (mostly named: points3D.txt) instead of the camera or images file. This file has the following format, when opening it in any text editor:</p>
                                <div class="code-container">
                                    <ul class="line-numbers">
                                        <li>1</li>
                                        <li>2</li>
                                        <li>3</li>
                                        <li>4</li>
                                        <li>5</li>
                                    </ul>
                                    <ul class="code-lines">
                                        <li># 3D point list with one line of data per point:</li>
                                        <li>#   POINT3D_ID, X, Y, Z, R, G, B, ERROR, TRACK[] as (IMAGE_ID, POINT2D_IDX)</li>
                                        <li># Number of points: 105304, mean track length: 6.5531545003348528</li>
                                        <li>1 -2.6375808715820312 -3.159113645553589 5.8599467277526855 171 162 157 0.7627250660295559 19 56 747 4076 746 4081</li>
                                        <li>70489 -4.174145698547363 -0.19272787868976593 3.1809439659118652 149 150 152 0.342557520656781 70 5979 1071 4075 1072 ...</li>
                                    </ul>
                                </div>
                            </details>
                        </div>
                        <div class="faq">
                            <details>
                                <summary class= "faq-sum faq-text">How to archieve a Point cloud file in [.txt] format?</summary>
                                <p class= "faq-text" >You can use for example <a style="color : #015DE4;" href="https://colmap.github.io/">Colmap</a> to calculate a Point cloud file. If this is in [.bin] format, convert it to [.txt] format by using Colmap >> Export to txt</p>
                            </details>
                        </div>
                        <div class="faq">
                            <details>
                                <summary class="faq-sum faq-text">How to edit the Point cloud in Panoton Point cloud Editor?</summary>
                                <p class="faq-text">
                                    Editing a point cloud in the Panoton Point cloud Editor involves several key features designed to make the process intuitive and efficient. Here’s how you can get started and make the most of the tool:
                                    </br>
                                    <strong>1. Upload Your Point cloud:</strong> Begin by uploading your point cloud file using the 'Upload Point cloud File' button. Supported formats include .txt files that are formatted for 3D coordinates.
                                    </br>
                                    <strong>2. Adjust Viewing Parameters:</strong> Use the navigation tools to rotate, zoom, and pan across your point cloud. This will help you view the point cloud from various angles and inspect details closely.
                                    </br>
                                    <strong>3. Set the Crop Radius:</strong> If you need to focus on a specific area, adjust the 'Crop Radius' slider. This allows you to hide points that are outside a certain radius from the center, focusing on a more specific segment of your point cloud.
                                    </br>
                                    <strong>4. Toggle Erase Mode:</strong> Activate the 'Erase Mode' by switching the toggle next to 'Toggle Eraser'. In this mode, you can click or drag over points to erase them. This is useful for cleaning up noise or removing unwanted points from your dataset.
                                    </br>
                                    <strong>5. Download Your Edited Point cloud:</strong> Once you are satisfied with your edits, you can download the modified point cloud by clicking the 'Download Points' button. This will save your changes to a new file, preserving the original data.
                                    </br>
                                    For more detailed instructions and additional features, refer to the Tutorial in the 'Help' section or contact us (info@panoton.de) for further assistance.
                                </p>
                            </details>
                        </div>
                        <div class="faq">
                            <details>
                                <summary class="faq-sum faq-text">Use Cases for the Point cloud Editor</summary>
                                <p class="faq-text">
                                    The Panoton Point cloud Editor is designed to enhance and simplify the manipulation of various types of point clouds, offering robust tools tailored for specific needs in industries like gaming, architecture, geospatial planning, and more. Here are some key use cases for this editor:
                                    </br>
                                    <strong>1. COLMAP Point Clouds:</strong>
                                    For users working with photogrammetry and 3D reconstruction, the editor provides tools to refine COLMAP point clouds. By allowing users to erase outliers and adjust density via cropping tools, the editor helps in cleaning up noise and improving the accuracy before exporting the data for 3D modeling or further processing.
                                    </br>
                                    <strong>2. Gaussian Splat Point Clouds:</strong>
                                    Gaussian splatting involves rendering point clouds with a smoothing effect to create a continuous surface. Before this process, our point cloud editor can be used to selectively edit and remove unwanted points, optimize the distribution, and modify radius parameters to achieve better visualization results in visualization software.
                                    </br>
                                    <strong>3. Architectural Visualization:</strong>
                                    Architects and designers can use the editor to manipulate scanned point clouds of buildings or construction sites. This helps in refining structural data, removing unnecessary points like moving objects or foliage, and preparing cleaner models for CAD applications.
                                    </br>
                                    <strong>4. Geospatial Data Handling:</strong>
                                    Geospatial analysts can benefit from the tool’s ability to manage and edit large-scale terrain data. The editor allows for the precise adjustment of elevation points, removal of anomalies, and enhances data sets for use in urban planning and landscape analysis.
                                    </br>
                                    <strong>5. Game Development:</strong>
                                    Game developers can use the editor to sculpt and tweak point clouds for environmental assets. Ensuring the optimal level of detail and cleaning up artifacts to create immersive game worlds is facilitated by the editor’s intuitive interface and powerful editing capabilities.
                                    </br>
                                    These use cases demonstrate the versatility of the Panoton Point cloud Editor, making it an indispensable tool for professionals seeking to enhance their point cloud data for various applications.
                                </p>
                            </details>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </section>

</body>

<!-- Footer Section End -->

<script type="text/css">
  @media screen and  (max-width: 600px) {
    #cubemap {
      width: 324px;
      height: 248px;
    }
  }
  @media screen and (min-width: 601px) and (max-width: 1000px) {
    #cubemap {
      width: 404px;
      height: 303px;
    }
  }
  @media screen and (min-width: 1001px) and (max-width: 1400px) {
    #cubemap {
      width: 604px;
      height: 453px;
    }
  }
  @media screen and (min-width: 1401px) {
    #cubemap {
      width: 804px;
      height: 603px;
    }
  }
</script>

<script>
    function updateCubeRotation(value) {
        document.getElementById('cubeRotationValue').value = value;
    }
    function updateCubeRotationSlider(value) {
        document.getElementById('cubeRotationValue').value = value;
    }

</script>

<script>
    // Function to check if the device is a mobile device
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Apply text-align: center style to <div class="row"> if it's a mobile device
    window.addEventListener('load', function() {
        if (isMobileDevice()) {
            const rowDiv = document.querySelector('.row');
            if (rowDiv) {
                rowDiv.style.textAlign = 'center';
            }
        }
    });
</script>

</html>
