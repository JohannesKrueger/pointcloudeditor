<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="shortcut icon" type="image/x-icon" href="../../img/favicon.ico" />
    <meta name="Description" content="Point cloud Editor – Edit, Crop and Clear Point Clouds in Browser Tool - Panoton"/>
    <meta name="Keyword" content="Point cloud Editor, colmap, gaussian splatting, pointcloud, editor"/>
    <meta name="author" content="PPoint cloud Editor in Browser"/>
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

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/FileSaver.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.138.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.138.0/examples/js/controls/OrbitControls.js"></script>

    <!-- Google Font -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
    rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Aldrich&display=swap" rel="stylesheet">

    <!-- Css Styles -->
    <link rel="stylesheet" href="../../css/bootstrap.min.css" type="text/css">
    <link rel="stylesheet" href="../../css/font-awesome.min.css" type="text/css">
    <link rel="stylesheet" href="../../css/elegant-icons.css" type="text/css">
    <link rel="stylesheet" href="../../css/owl.carousel.min.css" type="text/css">
    <link rel="stylesheet" href="../../css/slicknav.min.css" type="text/css">
    <link rel="stylesheet" href="../../css/style.css" type="text/css">
  <style>
    .settings > * {
      margin-top: 12px;
      margin-bottom: 12px;
    }
    #cubemap {
      /* 
      width: 805px;
      height: 600px;
      */
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
  </style>
</head>

<body>
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
        /* Standard styling for all browsers */
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
</body>

</footer>
<!-- Footer Section End -->

<style type="text/css">
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
</style>

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


<!-- Js Plugins -->
<script src="../../js/jquery-3.3.1.min.js"></script>
<script src="../../js/bootstrap.min.js"></script>
<script src="../../js/jquery.slicknav.js"></script>
<script src="../../js/owl.carousel.min.js"></script>
<script src="../../js/slick.min.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/getdata.js"></script>

</html>