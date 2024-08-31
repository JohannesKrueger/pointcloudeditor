document.addEventListener('DOMContentLoaded', function() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth - 25, window.innerHeight - 25);
    document.getElementById('rendererContainer').appendChild(renderer.domElement);

    let pointsMesh;
    let points = [];
    let modifiedImages = [];
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.z = 5;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let eraseMode = false;

    const toggleButton = document.getElementById('toggleEraseMode');
    const uploadInput = document.getElementById('pointcloudUpload');
    const downloadButton = document.getElementById('downloadPoints');

    let transformations = []; // List to track transformations

    function logToConsole(message) {
        const consoleOutput = document.getElementById('console-output');
        const timestamp = new Date().toLocaleTimeString();
        consoleOutput.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    logToConsole("Welcome to the Pointcloud Editor!");

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    let camerasLoaded = false;
    let imagesImported = false;
    let pointcloudImported = false;

    let cameras = {};
    let headerData = [];
    let imageHeaderData = [];
    let pyramids = [];
    let lastTranslation = { x: 0, y: 0, z: 0 };
    let lastRotation = { x: 0, y: 0, z: 0 };
    let rotationQuaternion = new THREE.Quaternion();
    let pivotPoint = new THREE.Vector3();

    function coloruploaddivs() {
        var pointcloudUploadDiv = document.querySelector('.pointcloudupload');
        var camerasAndImagesUploadDiv = document.querySelector('.camerasandimagesupload');
        if (pointcloudImported) {
            pointcloudUploadDiv.style.backgroundColor = '#90EE90';
        }
        if (imagesImported && camerasLoaded) {
            camerasAndImagesUploadDiv.style.backgroundColor = '#90EE90';
        } else if ((imagesImported && !camerasLoaded) || (!imagesImported && camerasLoaded)) {
            camerasAndImagesUploadDiv.style.backgroundColor = '#FFD580';
        }
    }

    uploadInput.addEventListener('change', function(event) {
        if (this.files.length > 0) {
            // Show loading spinner
            document.getElementById('loading-overlay').style.display = 'flex';
            document.getElementById('loading-message').textContent = "Loading Pointcloud...";

            logToConsole("Loading Pointcloud...");
            pointcloudImported = true;
            coloruploaddivs();
            const file = this.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                loadPoints(text).then(loadedPoints => {
                    points = loadedPoints;
                    if (pointsMesh) {
                        scene.remove(pointsMesh);
                        pointsMesh.geometry.dispose();
                        pointsMesh.material.dispose();
                    }
                    renderPoints(points);
                    // Hide loading spinner
                    document.getElementById('loading-overlay').style.display = 'none';
                });
            };
            reader.readAsText(file);
        }
    });

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

    const uploadImagesInput = document.getElementById('imagesUpload');
    let imageChunks = [];
    let imageDataMap = new Map();
    let fileChunkSizes = [];
    let points2DMap = new Map();
    let headerLines = [];

    uploadImagesInput.addEventListener('change', function(event) {
        // Show loading spinner
        document.getElementById('loading-overlay').style.display = 'flex';
        document.getElementById('loading-message').textContent = "Loading Images...";

        logToConsole("Loading Images...");
        imagesImported = true;
        coloruploaddivs();
        const file = event.target.files[0];
        const chunkSize = 10 * 1024 * 1024 * 50;
        let offset = 0;
        let leftover = '';

        const reader = new FileReader();

        reader.onload = function(e) {
            if (e.target.error == null) {
                const chunk = e.target.result;
                offset += chunk.length;
                logToConsole(`Loaded ${offset} bytes`);

                imageChunks.push(chunk);
                fileChunkSizes.push(chunk.length);

                processChunk(leftover + chunk);

                leftover = chunk.slice(chunk.lastIndexOf('\n') + 1);

                if (offset < file.size) {
                    readNextChunk();
                } else {
                    logToConsole("File fully loaded");
                    if (leftover) {
                        processChunk(leftover);
                        imageChunks.push(leftover);
                    }
                    loadImages();
                    // Hide loading spinner
                    document.getElementById('loading-overlay').style.display = 'none';
                }
            } else {
                logToConsole(`Read error: ${e.target.error}`);
                // Hide loading spinner
                document.getElementById('loading-overlay').style.display = 'none';
                return;
            }
        };

        reader.onerror = function(e) {
            logToConsole(`Read error: ${e.target.error}`);
            // Hide loading spinner
            document.getElementById('loading-overlay').style.display = 'none';
        };

        function readNextChunk() {
            const slice = file.slice(offset, offset + chunkSize);
            reader.readAsText(slice);
        }

        function processChunk(chunk) {
            const lines = chunk.split('\n');
            for (let i = 0; i < lines.length - 1; i++) {
                processLine(lines[i]);
            }
        }

        function processLine(line) {
            if (headerLines.length < 4) {
                headerLines.push(line);
                return;
            }

            line = line.trim();
            if (line.startsWith('#') || line === '') return;

            const parts = line.split(/\s+/);

            if (parts.length === 10) {
                const [imageId, qw, qx, qy, qz, tx, ty, tz, cameraId, ...nameParts] = parts;
                const camera = cameras[cameraId];
                if (camera) {
                    const quaternion = new THREE.Quaternion(-qx, -qy, -qz, qw);
                    const position = new THREE.Vector3(tx, ty, tz);
                    const imageName = nameParts.join(' ');
                    const imageData = { imageId, qw, qx, qy, qz, tx, ty, tz, cameraId, name: imageName, points2D: [] };

                    modifiedImages.push(imageData);
                    imageDataMap.set(imageId, imageData);

                    const inverseTranslation = new THREE.Vector3(tx, ty, tz).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(quaternion));
                    inverseTranslation.multiplyScalar(-1);
                    createCameraMarker(inverseTranslation.x, inverseTranslation.y, inverseTranslation.z, quaternion, camera);
                }
            } else if (parts.length > 10) {
                const imageId = parseInt(parts[0], 10);
                if (imageDataMap.has(imageId)) {
                    let imageData = imageDataMap.get(imageId);
                    imageData.points2D.push(line);
                    imageDataMap.set(imageId, imageData);
                }
            }
        }

        readNextChunk();
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
        logToConsole("Cameras have been loaded successfully");
        camerasLoaded = true;
    }

    function loadImages() {
        for (const [imageId, points2D] of points2DMap.entries()) {
            if (imageDataMap.has(imageId)) {
                imageDataMap.get(imageId).points2D = points2D;
            }
        }
        logToConsole("Images loaded and processed successfully.");
    }

    function createCameraMarker(x, y, z, quaternion, cameraParams) {
        const focalLength = cameraParams.params[0];
        const widthScale = 0.1 * focalLength / cameraParams.width;
        const heightScale = 0.1 * focalLength / cameraParams.height;
        const pyramidHeight = (widthScale + heightScale);
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            -widthScale, -heightScale, -pyramidHeight,
            widthScale, -heightScale, -pyramidHeight,
            widthScale, heightScale, -pyramidHeight,
            -widthScale, heightScale, -pyramidHeight,
            0, 0, 0
        ]);
        const indices = [
            0, 1, 4,
            1, 2, 4,
            2, 3, 4,
            3, 0, 4,
            0, 2, 1,
            0, 3, 2
        ];
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFAD5C,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const pyramid = new THREE.Mesh(geometry, material);
        pyramid.position.set(x, y, z);
        pyramid.quaternion.copy(quaternion);
        pyramid.userData.isCamera = true;
        scene.add(pyramid);
        pyramids.push(pyramid);
    }

    function loadPoints(text) {
        const lines = text.split('\n');
        points = [];
        headerData = [];
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
                    const track = parts.slice(8);
                    points.push({ point3DId, x, y, z, r, g, b, error, track });
                }
            }
        });
        logToConsole("Points have been loaded successfully...");
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
        const deltaX = translateX - lastTranslation.x;
        const deltaY = translateY - lastTranslation.y;
        const deltaZ = translateZ - lastTranslation.z;
        lastTranslation.x = translateX;
        lastTranslation.y = translateY;
        lastTranslation.z = translateZ;
        const translationVector = new THREE.Vector3(deltaX, deltaY, deltaZ);
        if (pointsMesh) {
            pointsMesh.position.add(translationVector);
        }
        scene.traverse(function(object) {
            if (object.userData.isCamera) {
                object.position.add(translationVector);
            }
        });

        // Track transformation
        transformations.push({
            type: 'translation',
            value: translationVector.clone()
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
        const deltaX = THREE.MathUtils.degToRad(rotateX - lastRotation.x);
        const deltaY = THREE.MathUtils.degToRad(rotateY - lastRotation.y);
        const deltaZ = THREE.MathUtils.degToRad(rotateZ - lastRotation.z);
        lastRotation.x = rotateX;
        lastRotation.y = rotateY;
        lastRotation.z = rotateZ;
        const deltaQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(deltaX, deltaY, deltaZ, 'XYZ'));
        rotationQuaternion.multiplyQuaternions(deltaQuaternion, rotationQuaternion);
        if (pointsMesh) {
            pointsMesh.quaternion.multiplyQuaternions(deltaQuaternion, pointsMesh.quaternion);
            pointsMesh.position.applyQuaternion(deltaQuaternion);
        }
        scene.traverse(function(object) {
            if (object.userData.isCamera) {
                object.quaternion.multiplyQuaternions(deltaQuaternion, object.quaternion);
                object.position.applyQuaternion(deltaQuaternion);
            }
        });

        // Track transformation
        transformations.push({
            type: 'rotation',
            value: deltaQuaternion.clone()
        });

        applyTransformations();
        renderer.render(scene, camera);
    }

    function applyTransformations() {
        const rotationRadians = new THREE.Euler(
            THREE.MathUtils.degToRad(lastRotation.x),
            THREE.MathUtils.degToRad(lastRotation.y),
            THREE.MathUtils.degToRad(lastRotation.z),
            'XYZ'
        );
        const rotationQuaternion = new THREE.Quaternion().setFromEuler(rotationRadians);
        cropSphere.quaternion.copy(rotationQuaternion);
        cropSphere.position.set(lastTranslation.x, lastTranslation.y, lastTranslation.z);
    }

    const sphereRadiusSlider = document.getElementById('sphereRadius');
    const radiusValueDisplay = document.getElementById('radiusValue');
    let sphereRadius = parseFloat(sphereRadiusSlider.value);

    sphereRadiusSlider.addEventListener('input', function() {
        sphereRadius = parseFloat(this.value);
        radiusValueDisplay.textContent = sphereRadius;
        updateCropSphereRadius(sphereRadius);
        applySphereCrop();
    });

    function updateCropSphereRadius(newRadius) {
        cropSphere.geometry.dispose();
        const newGeometry = new THREE.SphereGeometry(newRadius, 64, 64);
        const newWireframe = new THREE.WireframeGeometry(newGeometry);
        cropSphere.geometry = newWireframe;
    }

    function applySphereCrop() {
        const attributes = pointsMesh.geometry.attributes;
        const positions = attributes.position.array;
        const colors = attributes.color.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);
            const colorIndex = i;
            if (distanceFromCenter > sphereRadius) {
                colors[colorIndex] = 1;
                colors[colorIndex + 1] = 0;
                colors[colorIndex + 2] = 0;
            } else {
                const pointIndex = i / 3;
                colors[colorIndex] = points[pointIndex].r / 255;
                colors[colorIndex + 1] = points[pointIndex].g / 255;
                colors[colorIndex + 2] = points[pointIndex].b / 255;
            }
        }
        pointsMesh.geometry.attributes.color.needsUpdate = true;
    }

    toggleButton.addEventListener('change', function() {
        eraseMode = this.checked;
        if (eraseMode) {
            cropSphere.visible = false;
            document.body.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\' viewport=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'12\' cy=\'12\' r=\'9\'/></svg>") 12 12, auto';
        } else {
            cropSphere.visible = true;
            document.body.style.cursor = 'default';
        }
    });

    downloadButton.addEventListener('click', function() {
        if (pointcloudImported) {
            document.getElementById('loading-overlay').style.display = 'flex';
            document.getElementById('points-progress').value = 0;
            document.getElementById('images-progress').value = 0;

            setTimeout(async function() {
                logToConsole("Preparing modified points3D.txt Download...");
                const attributes = pointsMesh.geometry.attributes;
                const positions = attributes.position.array;
                const colors = attributes.color.array;
                let outputPoints = headerData.slice(0, -1);
                const remainingPoints = [];
                points.forEach((point, index) => {
                    if (colors[index * 3] !== 1) {
                        remainingPoints.push(point);
                    }
                });
                let lastHeaderLine = headerData[headerData.length - 1];
                let meanTrackLength = lastHeaderLine.match(/mean track length: ([\d\.]+)/)[1];
                lastHeaderLine = `# Number of points: ${remainingPoints.length}, mean track length: ${meanTrackLength}`;
                outputPoints.push(lastHeaderLine);

                const processPoints = async () => {
                    const totalPoints = remainingPoints.length;
                    for (let i = 0; i < totalPoints; i++) {
                        if (i % Math.ceil(totalPoints / 20) === 0) {
                            document.getElementById('points-progress').value = (i / totalPoints) * 100;
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }

                        const point = remainingPoints[i];
                        const index = points.indexOf(point) * 3;
                        let pos = new THREE.Vector3(positions[index], positions[index + 1], positions[index + 2]);

                        // Apply all transformations in the correct order
                        transformations.forEach(transformation => {
                            if (transformation.type === 'translation') {
                                pos.add(transformation.value);
                            } else if (transformation.type === 'rotation') {
                                pos.applyQuaternion(transformation.value);
                            }
                        });

                        const trackString = point.track.join(' ');
                        outputPoints.push(`${point.point3DId} ${pos.x.toFixed(16)} ${pos.y.toFixed(16)} ${pos.z.toFixed(16)} ${Math.round(colors[index] * 255)} ${Math.round(colors[index + 1] * 255)} ${Math.round(colors[index + 2] * 255)} ${point.error.toFixed(16)} ${trackString}`);
                    }
                };

                await processPoints();
                outputPoints = outputPoints.join('\n');
                if (imagesImported) {
                    logToConsole("Preparing modified images.txt Download");
                    await downloadModifiedFile('modifiedImages.txt');
                }
                logToConsole("Downloading modified points3D.txt ...");
                const blobPoints = new Blob([outputPoints], { type: 'text/plain' });
                const urlPoints = URL.createObjectURL(blobPoints);
                const aPoints = document.createElement('a');
                aPoints.href = urlPoints;
                aPoints.download = 'modifiedPoints3D.txt';
                aPoints.click();
                logToConsole("Download has been successful");
                document.getElementById('loading-overlay').style.display = 'none';
            }, 100);
        }
    });

    async function downloadModifiedFile(filename) {
        let updatedChunks = [];
        const processedImages = processImageData();
        let imageData = [];
        let points2DData = [];
        let leftoverLine = '';
        const totalImages = imageChunks.length;
        const imageRegex = /^\d+ .*?\.(jpg|png)\s*$/;

        const processImages = async () => {
            for (let chunkIndex = 0; chunkIndex < imageChunks.length; chunkIndex++) {
                let lines = imageChunks[chunkIndex].split('\n');

                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];

                    if (leftoverLine) {
                        line = leftoverLine + line;
                        leftoverLine = '';
                    }

                    if (i === lines.length - 1 && line.charAt(line.length - 1) !== '\n') {
                        leftoverLine = line;
                    } else {
                        if (line.match(imageRegex)) {
                            imageData.push(line);
                        } else {
                            points2DData.push(line);
                        }
                    }
                }

                if (chunkIndex % Math.ceil(totalImages / 20) === 0) { // Update every 5%
                    document.getElementById('images-progress').value = (chunkIndex / totalImages) * 100;
                    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to allow UI update
                }
            }
        };

        await processImages();

        if (leftoverLine) {
            if (leftoverLine.match(/^\d+ /)) {
                imageData.push(leftoverLine);
            } else {
                points2DData.push(leftoverLine);
            }
        }

        for (let interindex = 0; interindex < imageData.length + 4; interindex++) {
            if (interindex >= 4) {
                updatedChunks.push(processedImages[interindex - 4]);
                updatedChunks.push('\n');
            }
            updatedChunks.push(points2DData[interindex]);
            updatedChunks.push('\n');
        }

        let modifiedContent = updatedChunks;
        logToConsole("Downloading modified images.txt ...");

        const blob = new Blob(modifiedContent, { type: 'text/plain' });
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
            if (!pyramid) {
                console.error(`No pyramid found for image ${image.imageId}`);
                return;
            }

            const correctedQuaternion = pyramid.quaternion.clone().conjugate();
            const adjustedPosition = pyramid.position.clone();
            const reversedPosition = adjustedPosition.applyQuaternion(correctedQuaternion);
            const pivotInverse = pivotPoint.clone().applyQuaternion(correctedQuaternion);
            const finalPosition = reversedPosition.sub(pivotInverse);
            const correctedPosition = finalPosition.multiplyScalar(-1);

            if (isNaN(correctedQuaternion.w) || isNaN(correctedQuaternion.x) ||
                isNaN(correctedQuaternion.y) || isNaN(correctedQuaternion.z)) {
                console.error('Quaternion components are not valid numbers:', correctedQuaternion);
                return;
            }

            let points2DString = image.points2D ? image.points2D.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p.point3DId}`).join(' ') : '';
            outputImages.push(`${image.imageId} ${Number(correctedQuaternion.w).toFixed(16)} ${Number(correctedQuaternion.x).toFixed(16)} ${Number(correctedQuaternion.y).toFixed(16)} ${Number(correctedQuaternion.z).toFixed(16)} ${correctedPosition.x.toFixed(16)} ${correctedPosition.y.toFixed(16)} ${correctedPosition.z.toFixed(16)} ${image.cameraId} ${image.name} ${points2DString}`);
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
            let cameraZ = maxDim / 2 / Math.tan(fov / 2);
            cameraZ *= 1.1;
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

    let isMouseDown = false;

    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mouseup', onMouseUp, false);

    function onMouseDown(event) {
        controls.enabled = !eraseMode;
        if (eraseMode) {
            processClick(event);
            isMouseDown = true;
        }
    }

    function onMouseMove(event) {
        if (eraseMode && isMouseDown) {
            processClick(event);
        }
        if (eraseMode) {
            updateCursor(event);
        }
    }

    function onMouseUp(event) {
        controls.enabled = true;
        isMouseDown = false;
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
                intersect.object.geometry.attributes.color.setX(intersect.index, 1);
                intersect.object.geometry.attributes.color.setY(intersect.index, 0);
                intersect.object.geometry.attributes.color.setZ(intersect.index, 0);
            });
            intersects[0].object.geometry.attributes.color.needsUpdate = true;
        }
    }
});
