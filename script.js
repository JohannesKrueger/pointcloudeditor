document.addEventListener('DOMContentLoaded', function() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth -25, window.innerHeight-25);
    document.getElementById('rendererContainer').appendChild(renderer.domElement);

    let pointsMesh; // Declare pointsMesh at a scope accessible to all relevant functions
    let points = []; // Store all point data globally

    let modifiedImages = []; // This will hold transformed image data for download

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.z = 5; // Set an initial position for the camera

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let eraseMode = false;

    const toggleButton = document.getElementById('toggleEraseMode'); // This is now the checkbox
    const uploadInput = document.getElementById('pointcloudUpload');
    const downloadButton = document.getElementById('downloadPoints');

    function logToConsole(message) {
        const consoleOutput = document.getElementById('console-output');
        const timestamp = new Date().toLocaleTimeString();
        consoleOutput.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight; // Scroll to bottom
    }

    logToConsole("Welcome to the Pointcloud Editor!");

    const axesHelper = new THREE.AxesHelper(5); // The number 5 defines the size of the axes
    scene.add(axesHelper);

    let camerasLoaded = false;
    let imagesImported = false;
    let pointcloudImported = false;

    // function variables
    let cameras = {};
    let originalFileContent = '';
    let headerData = [];
    let imageHeaderData = []; // Initialize this at the top with other declarations
    let pyramids = [];
    let lastTranslation = { x: 0, y: 0, z: 0 };
    let initialRotations = new Map();
    let lastRotation = { x: 0, y: 0, z: 0 };
    let rotationQuaternion = new THREE.Quaternion(); // Global quaternion to accumulate rotation
    let pivotPoint = new THREE.Vector3(); // Define the pivot point globally

    function coloruploaddivs() {

        var pointcloudUploadDiv = document.querySelector('.pointcloudupload');
        var camerasAndImagesUploadDiv = document.querySelector('.camerasandimagesupload');

        if (pointcloudImported) {
            pointcloudUploadDiv.style.backgroundColor = '#90EE90';
        }
        if (imagesImported && camerasLoaded) {
            camerasAndImagesUploadDiv.style.backgroundColor = '#90EE90';
        } else if((imagesImported && !camerasLoaded) || (!imagesImported && camerasLoaded)) {
            camerasAndImagesUploadDiv.style.backgroundColor = '#FFD580';
        }

    }

    uploadInput.addEventListener('change', function(event) {
        if (this.files.length > 0) {
            logToConsole("Loading Pointcloud...");
            pointcloudImported = true;
            coloruploaddivs();
            const file = this.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                loadPoints(text).then(loadedPoints => {
                    points = loadedPoints; // Update global points array
                    if (pointsMesh) {
                        scene.remove(pointsMesh);
                        pointsMesh.geometry.dispose();
                        pointsMesh.material.dispose();
                    }
                    renderPoints(points);
                });
            };
            reader.readAsText(file);
        }
    });

    // Load camera intrinsics from cameras.txt
    const uploadCameraInput = document.getElementById('camerasUpload');
    uploadCameraInput.addEventListener('change', function(event) {
        logToConsole("Loading Cameras...");
        camerasLoaded = true;
        coloruploaddivs();
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            loadCameras(text);
        };
        reader.readAsText(file);
    });

    // Load camera extrinsics and render from images.txt
    const uploadImagesInput = document.getElementById('imagesUpload');
    uploadImagesInput.addEventListener('change', function(event) {
        logToConsole("Loading Images...");
        imagesImported = true;
        coloruploaddivs();
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            originalFileContent = e.target.result;
            const imagesText = e.target.result;
            loadImages(imagesText);
        };
        reader.readAsText(file);
    });

    function loadCameras(text) {
        const lines = text.split('\n');
        lines.forEach(line => {
            if (!line.startsWith('#') && line.trim() !== '') {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5) {
                    const [cameraId, model, width, height, ...params] = parts;
                    cameras[cameraId] = { model, width: parseInt(width), height: parseInt(height), params: params.map(Number) };
                }
            }
        });
        logToConsole("Cameras have been loaded succesfully");
        camerasLoaded = true;
    }

    function loadImages(text) {

        imageHeaderData = [];
        modifiedImages = []; // Reset when new images are loaded

        const lines = text.split('\n');
        lines.forEach(line => {
            if (!line.startsWith('#') && line.trim() !== '') {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 9) {
                    const [imageId, qw, qx, qy, qz, tx, ty, tz, cameraId] = parts.map(Number);
                    const camera = cameras[cameraId];

                    if (camera) {
                        // Convert quaternion to Three.js format
                        const quaternion = new THREE.Quaternion(-qx, -qy, -qz, qw); // Negative for the conjugate
                        const position = new THREE.Vector3(tx, ty, tz);
                        const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

                        modifiedImages.push({ imageId, qw, qx, qy, qz, tx, ty, tz, cameraId, name: parts[9] }); // Assuming parts[9] is the image name

                        // Calculate inverse translation
                        const inverseTranslation = new THREE.Vector3(tx, ty, tz).applyMatrix4(rotationMatrix);
                        inverseTranslation.multiplyScalar(-1);

                        createCameraMarker(inverseTranslation.x, inverseTranslation.y, inverseTranslation.z, quaternion, camera);
                    }
                }
            }
        });
        logToConsole("Images have been loaded succesfully...");
        imagesImported = true;
    }

    function createCameraMarker(x, y, z, quaternion, cameraParams) {
        const focalLength = cameraParams.params[0];
        const widthScale = 0.1 * focalLength / cameraParams.width;  // Control dimensions
        const heightScale = 0.1 * focalLength / cameraParams.height;
        const pyramidHeight = (widthScale + heightScale);  // Reasonable height based on dimensions

        // Create custom pyramid geometry
        const geometry = new THREE.BufferGeometry();

        // Adjust vertices so the top of the pyramid is at (0, 0, 0) and base below it
        const vertices = new Float32Array([
            // Base vertices
            -widthScale, -heightScale, -pyramidHeight, // Bottom left
            widthScale, -heightScale, -pyramidHeight,  // Bottom right
            widthScale, heightScale, -pyramidHeight,   // Top right
            -widthScale, heightScale, -pyramidHeight,  // Top left

            // Apex at origin, adjusted to be at position where the camera is
            0, 0, 0  // Pyramid peak, corresponding to camera position
        ]);

        // Indices for the base and sides of the pyramid
        const indices = [
            0, 1, 4, // Each side of the pyramid
            1, 2, 4,
            2, 3, 4,
            3, 0, 4,

            // Base - rendered as double-sided
            0, 2, 1,
            0, 3, 2
        ];

        // Assign vertices and indices to the geometry
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals(); // Ensures correct light reflection

            // Create a mesh with the geometry and a material
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFAD5C,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const pyramid = new THREE.Mesh(geometry, material);
        
        // Position the pyramid apex at the given x, y, z
        pyramid.position.set(x, y, z);
        
        // Adjust quaternion and apply to pyramid
        pyramid.quaternion.copy(quaternion);

        // Flag as camera for any camera-specific logic
        pyramid.userData.isCamera = true; 

        // Add to the scene
        scene.add(pyramid);
        pyramids.push(pyramid);
    }

    function loadPoints(text) {
        const lines = text.split('\n');
        points = []; // Reset points array
        headerData = []; // Reset header data

        lines.forEach(line => {
            if (line.trim().startsWith('#')) {
                headerData.push(line);
            } else if (line.trim() && !line.startsWith('#')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 8) {
                    const point3DId = parts[0];
                    const x = parseFloat(parts[1]);
                    const y = parseFloat(parts[2]);
                    const z = parseFloat(parts[3]);
                    const r = parseInt(parts[4]);
                    const g = parseInt(parts[5]);
                    const b = parseInt(parts[6]);
                    const error = parseFloat(parts[7]);
                    const track = parts.slice(8); // Capturing the rest as track data
                    points.push({ point3DId, x, y, z, r, g, b, error, track });
                }
            }
        });
        logToConsole("Points have been loaded succesfully...");
        pointcloudImported = true;
        return Promise.resolve(points);
    }

    document.getElementById('translateX').addEventListener('change', applyTranslation);
    document.getElementById('translateY').addEventListener('change', applyTranslation);
    document.getElementById('translateZ').addEventListener('change', applyTranslation);

    function applyTranslation() {

        const translateX = parseFloat(document.getElementById('translateX').value);
        const translateY = parseFloat(document.getElementById('translateY').value);
        const translateZ = parseFloat(document.getElementById('translateZ').value);

        // Calculate the change in translation
        const deltaX = translateX - lastTranslation.x;
        const deltaY = translateY - lastTranslation.y;
        const deltaZ = translateZ - lastTranslation.z;

        // Update last translation values
        lastTranslation.x = translateX;
        lastTranslation.y = translateY;
        lastTranslation.z = translateZ;

        // Set up a vector for the differential translation
        const translationVector = new THREE.Vector3(deltaX, deltaY, deltaZ);

        // Apply translation to the point cloud if it exists
        if (pointsMesh) {
            pointsMesh.position.add(translationVector);
        }

        // Apply translation to all camera markers
        scene.traverse(function (object) {
            if (object.userData.isCamera) {
                object.position.add(translationVector);
            }
        });

        applyTransformations();

        renderer.render(scene, camera);
    }

    document.getElementById('rotateX').addEventListener('change', applyRotation);
    document.getElementById('rotateY').addEventListener('change', applyRotation);
    document.getElementById('rotateZ').addEventListener('change', applyRotation);

    function applyRotation() {
        const rotateX = parseFloat(document.getElementById('rotateX').value);
        const rotateY = parseFloat(document.getElementById('rotateY').value);
        const rotateZ = parseFloat(document.getElementById('rotateZ').value);

        // Calculate the delta rotation
        const deltaX = THREE.MathUtils.degToRad(rotateX - lastRotation.x);
        const deltaY = THREE.MathUtils.degToRad(rotateY - lastRotation.y);
        const deltaZ = THREE.MathUtils.degToRad(rotateZ - lastRotation.z);

        // Update last rotation values
        lastRotation.x = rotateX;
        lastRotation.y = rotateY;
        lastRotation.z = rotateZ;

        // Create a quaternion from the delta rotation
        const deltaQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(deltaX, deltaY, deltaZ, 'XYZ'));
        rotationQuaternion.multiplyQuaternions(deltaQuaternion, rotationQuaternion); // Accumulate the rotation

        // Apply rotation to the point cloud and cameras
        if (pointsMesh) {
            pointsMesh.quaternion.multiplyQuaternions(deltaQuaternion, pointsMesh.quaternion);
            pointsMesh.position.sub(pivotPoint).applyQuaternion(deltaQuaternion).add(pivotPoint); // Rotate around pivot
        }

        scene.traverse(function (object) {
            if (object.userData.isCamera) {
                object.quaternion.multiplyQuaternions(deltaQuaternion, object.quaternion);
                object.position.sub(pivotPoint).applyQuaternion(deltaQuaternion).add(pivotPoint); // Rotate around pivot
            }
        });

        applyTransformations();

        renderer.render(scene, camera);
    }

    // This function should ideally be called once to set a common pivot for rotation
    function calculateSceneCenter() {
        if (pointsMesh) {
            const box = new THREE.Box3().setFromObject(pointsMesh);
            pivotPoint.copy(box.getCenter(new THREE.Vector3()));
        }
    }

    calculateSceneCenter(); // Set the pivot point based on the point cloud

    // Sphere visualization setup
    let cropSphere;
    const sphereMaterial = new THREE.LineBasicMaterial({ color: 0x015DE4, transparent: true, opacity: 0.5 });
    const sphereGeometry = new THREE.SphereGeometry(50, 64, 64); // Default radius and high segment count for smoothness
    const wireframe = new THREE.WireframeGeometry(sphereGeometry);
    cropSphere = new THREE.LineSegments(wireframe, sphereMaterial);
    scene.add(cropSphere);

    function updateCropSphereRadius(newRadius) {
        cropSphere.geometry.dispose(); // Dispose of the old geometry
        const newGeometry = new THREE.SphereGeometry(newRadius, 64, 64);
        const newWireframe = new THREE.WireframeGeometry(newGeometry);
        cropSphere.geometry = newWireframe;
    }

    function applyTransformations() {
        // Convert rotation from degrees to radians and create a THREE.Euler object
        const rotationRadians = new THREE.Euler(
            THREE.MathUtils.degToRad(lastRotation.x),
            THREE.MathUtils.degToRad(lastRotation.y),
            THREE.MathUtils.degToRad(lastRotation.z),
            'XYZ'  // This 'XYZ' is the order of rotations; can be adjusted if needed
        );

        // Convert Euler angles to a quaternion for better composability and performance
        const rotationQuaternion = new THREE.Quaternion().setFromEuler(rotationRadians);

        // Set the rotation
        cropSphere.quaternion.copy(rotationQuaternion);

        // Then apply translation
        cropSphere.position.set(lastTranslation.x, lastTranslation.y, lastTranslation.z);
    }

    const sphereRadiusSlider = document.getElementById('sphereRadius');
    const radiusValueDisplay = document.getElementById('radiusValue');
    let sphereRadius = parseFloat(sphereRadiusSlider.value);

    sphereRadiusSlider.addEventListener('input', function() {
        sphereRadius = parseFloat(this.value);
        radiusValueDisplay.textContent = sphereRadius;
        updateCropSphereRadius(sphereRadius); // Update the visual sphere's radius
        applySphereCrop();
    });

    function applySphereCrop() {
        const attributes = pointsMesh.geometry.attributes;
        const positions = attributes.position.array;
        const colors = attributes.color.array;

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);
            const colorIndex = i; // Colors are tightly packed RGB, RGB, RGB...
            if (distanceFromCenter > sphereRadius) {
                colors[colorIndex] = 1; // Set red
                colors[colorIndex + 1] = 0; // Set green to 0
                colors[colorIndex + 2] = 0; // Set blue to 0
            } else {
                // Restore original color if inside the new radius
                const pointIndex = i / 3;
                colors[colorIndex] = points[pointIndex].r / 255;
                colors[colorIndex + 1] = points[pointIndex].g / 255;
                colors[colorIndex + 2] = points[pointIndex].b / 255;
            }
        }

        pointsMesh.geometry.attributes.color.needsUpdate = true;
    }


    toggleButton.addEventListener('change', function() {
        eraseMode = this.checked; // Use the 'checked' property
        if (eraseMode) {
            cropSphere.visible = false;
            document.body.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\' viewport=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'12\' cy=\'12\' r=\'9\'/></svg>") 12 12, auto';
        } else {
            cropSphere.visible = true;
            document.body.style.cursor = 'default';
        }
    });

    function calculateMeanObservations(images) {
        let totalObservations = 0;
        images.forEach(image => {
            // Check if points2D exists before accessing its length
            if (image.points2D) {
                totalObservations += image.points2D.length;
            }
        });
        return images.length > 0 ? totalObservations / images.length : 0; // Avoid division by zero
    }

    downloadButton.addEventListener('click', function() {
        // Prepare point cloud data
        if (pointcloudImported) {
            logToConsole("Preparing modified points3D.txt Download...");
            const attributes = pointsMesh.geometry.attributes;
            const positions = attributes.position.array;
            const colors = attributes.color.array;
            let outputPoints = headerData.slice(0, -1); // Copy the header data except the last line
            const remainingPoints = [];

            points.forEach((point, index) => {
                if (colors[index * 3] !== 1) { // Check if red (erased)
                    remainingPoints.push(point);
                }
            });

            let lastHeaderLine = headerData[headerData.length - 1];
            let meanTrackLength = lastHeaderLine.match(/mean track length: ([\d\.]+)/)[1];
            lastHeaderLine = `# Number of points: ${remainingPoints.length}, mean track length: ${meanTrackLength}`;
            outputPoints.push(lastHeaderLine);
            remainingPoints.forEach(point => {
                const index = points.indexOf(point) * 3;
                let pos = new THREE.Vector3(positions[index], positions[index + 1], positions[index + 2]);
                pos.applyQuaternion(rotationQuaternion); // Apply rotation
                pos.add(lastTranslation); // Apply translation

                const trackString = point.track.join(' ');
                outputPoints.push(`${point.point3DId} ${pos.x.toFixed(16)} ${pos.y.toFixed(16)} ${pos.z.toFixed(16)} ${Math.round(colors[index] * 255)} ${Math.round(colors[index + 1] * 255)} ${Math.round(colors[index + 2] * 255)} ${point.error.toFixed(16)} ${trackString}`);
            });

            outputPoints = outputPoints.join('\n'); // Convert point data to string

            if (imagesImported) { 
                logToConsole("Preparing modified images.txt Download");
                downloadModifiedFile(originalFileContent, 'modifiedImages.txt');
            }
            logToConsole("Downloading modified points3D.txt ...");
            // Create and download the blob for point cloud data
            const blobPoints = new Blob([outputPoints], { type: 'text/plain' });
            const urlPoints = URL.createObjectURL(blobPoints);
            const aPoints = document.createElement('a');
            aPoints.href = urlPoints;
            aPoints.download = 'modifiedPoints3D.txt';
            aPoints.click();
            logToConsole("Download has been succesfully");
        }

    });

    function downloadModifiedFile(originalData, filename) {
        // Split the original content into lines
        let lines = originalData.split('\n');

        // Load and process image data
        let outputImages = processImageData();

        // Start from the 5th line (index 4) and replace every second line if not empty
        for (let i = 4, j = 0; i < lines.length && j < outputImages.length; i += 2, j++) {
            if (lines[i].trim() !== "") {
                lines[i] = outputImages[j];  // Replace with calculated output
            }
        }

        // Join the lines back into a single string
        let modifiedContent = lines.join('\n');
        logToConsole("Downloading modified images.txt ...");
        // Create a Blob with the modified content
        const blob = new Blob([modifiedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.click();
        document.body.appendChild(downloadLink);
        document.body.removeChild(downloadLink);
    }

    function processImageData() {
        let outputImages = [];

        modifiedImages.forEach((image, index) => {
            const pyramid = pyramids[index];

            // Correctly invert the quaternion to represent the camera's original orientation
            const correctedQuaternion = pyramid.quaternion.clone().conjugate();


            // The position is first adjusted by removing the lastTranslation
            const adjustedPosition = pyramid.position.clone();

            // Apply the inverse rotation to the adjusted position
            const reversedPosition = adjustedPosition.applyQuaternion(correctedQuaternion);

            // Adjusting for the pivot point correction in reverse
            const pivotInverse = pivotPoint.clone().applyQuaternion(correctedQuaternion);
            const finalPosition = reversedPosition.sub(pivotInverse);

            // Negate the position to correct the direction
            const correctedPosition = finalPosition.multiplyScalar(-1);

            // Format the output string for this image
            let points2DString = image.points2D ? image.points2D.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p.point3DId}`).join(' ') : '';
            outputImages.push(`${image.imageId} ${correctedQuaternion.w.toFixed(16)} ${correctedQuaternion.x.toFixed(16)} ${correctedQuaternion.y.toFixed(16)} ${correctedQuaternion.z.toFixed(16)} ${correctedPosition.x.toFixed(16)} ${correctedPosition.y.toFixed(16)} ${correctedPosition.z.toFixed(16)} ${image.cameraId} ${image.name} ${points2DString}`);
        });

        return outputImages;
    }

    function renderPoints(points) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];

        points.forEach(point => {
            vertices.push(point.x, point.y, point.z);
            colors.push(point.r / 255, point.g / 255, point.b / 255);
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
        pointsMesh = new THREE.Points(geometry, material);
        scene.add(pointsMesh);

        adjustCameraToPoints();
    }

    function adjustCameraToPoints() {
        if (pointsMesh) {
            const box = new THREE.Box3().setFromObject(pointsMesh);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = maxDim / 2 / Math.tan(fov / 2); // Adjust the camera distance
            cameraZ *= 1.1; // Slight margin

            camera.position.set(center.x, center.y, center.z + cameraZ);
            camera.lookAt(center);
            controls.update();
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    let isMouseDown = false; // Track if the mouse is pressed down

    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mouseup', onMouseUp, false);

    function onMouseDown(event) {
        controls.enabled = !eraseMode;
        if (eraseMode) {
            processClick(event);
            isMouseDown = true;  // Set the flag that mouse is down
        }
    }

    function onMouseMove(event) {
        if (eraseMode && isMouseDown) {  // Check if in erase mode and mouse is down
            processClick(event);
        }
        // Update cursor position for visual feedback, if needed
        if (eraseMode) {
            updateCursor(event);
        }
    }

    function onMouseUp(event) {
        controls.enabled = true;
        isMouseDown = false;  // Reset the mouse down flag on mouse up
    }

    function updateCursor(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 2 - 1;
        const y = -(event.clientY - rect.top) / rect.height * 2 + 1;
        const vector = new THREE.Vector3(x, y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        
        eraseCircle.position.copy(pos);
        eraseCircle.visible = true;
    }

    function processClick(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(pointsMesh);
        if (intersects.length > 0) {
            intersects.forEach(intersect => {
                intersect.object.geometry.attributes.color.setX(intersect.index, 1); // Set red
                intersect.object.geometry.attributes.color.setY(intersect.index, 0); // Set green to 0
                intersect.object.geometry.attributes.color.setZ(intersect.index, 0); // Set blue to 0
            });
            intersects[0].object.geometry.attributes.color.needsUpdate = true;
        }
    }


});
