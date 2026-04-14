(function () {
    const appConfig = window.FISH_LIGHT_CONFIG || {};
    const defaults = appConfig.defaults || {};
    const uiText = appConfig.uiText || {};

    const modelPath = appConfig.xyzFile || "./ImageToStl.com_20251211110417_d743b9d5.xyz";
    const mediaPipeBasePath = appConfig.mediaPipeBasePath || "./libs/mediapipe/";

    let scene;
    let camera;
    let renderer;
    let controls;
    let particles;
    let particleGeometry;
    let particleMaterial;
    let hands;
    let cameraFeed;
    let isCameraActive = false;
    let currentScale = 1.0;
    let targetScale = 1.0;
    let rotationSpeed = typeof defaults.rotationSpeed === "number" ? defaults.rotationSpeed : 0.003;
    let diffusionEnabled = defaults.diffusionEnabled !== false;

    let originalPositions = null;
    let currentPositions = null;
    let particleColors = null;
    let displayIndices = null;

    let lastTime = performance.now();
    let frameCount = 0;

    let gestureHistory = [];
    const gestureHistorySize = 3;
    let continuousGestureActive = false;

    let diffusionFactor = 0;
    let targetDiffusion = 0;

    function text(key, fallback) {
        return uiText[key] || fallback;
    }

    function applyConfigToDom() {
        if (appConfig.title) {
            document.title = appConfig.title;
        }

        const panelTitle = document.getElementById("panel-title");
        if (panelTitle) {
            panelTitle.textContent = text("panelTitle", "🐟 鱼灯点云模型");
        }

        const loadingText = document.getElementById("loading-text");
        if (loadingText) {
            loadingText.textContent = text("loadingText", "正在加载点云数据...");
        }

        const density = document.getElementById("particle-density");
        if (density && defaults.particleDensity) {
            density.value = String(defaults.particleDensity);
        }

        const size = document.getElementById("particle-size");
        if (size && typeof defaults.particleSize === "number") {
            size.value = String(defaults.particleSize);
        }

        const color = document.getElementById("particle-color");
        if (color && defaults.particleColor) {
            color.value = defaults.particleColor;
        }

        const speed = document.getElementById("rotation-speed");
        if (speed && typeof defaults.rotationSpeed === "number") {
            speed.value = String(defaults.rotationSpeed);
        }

        const diffusion = document.getElementById("diffusion-effect");
        if (diffusion) {
            diffusion.checked = diffusionEnabled;
        }

        const status = document.getElementById("gesture-status");
        if (status) {
            status.textContent = text("cameraOff", "摄像头未开启");
        }
    }

    function initThreeJS() {
        const container = document.getElementById("canvas-container");

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a1a, 0.01);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
        camera.position.set(0, 0, typeof defaults.cameraZ === "number" ? defaults.cameraZ : 3);

        renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.sortObjects = false;

        container.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 0.1;
        controls.maxDistance = 20;
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 1.0;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x4fc3f7, 0.6, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        window.addEventListener("resize", onWindowResize, false);
    }

    async function loadXYZFile() {
        try {
            let content = null;

            try {
                const response = await fetch(modelPath);
                if (response.ok) {
                    content = await response.text();
                }
            } catch (error) {
                console.log("Fetch失败，尝试文件选择方式", error);
            }

            if (!content) {
                showFilePickerFallback();
                return;
            }

            processXYZData(content);
        } catch (error) {
            console.error("加载XYZ文件失败:", error);
            document.querySelector("#loading p").textContent = text("loadFailedPrefix", "加载失败: ") + error.message;
        }
    }

    function showFilePickerFallback() {
        document.querySelector("#loading p").textContent = text("selectFilePrompt", "请点击选择XYZ文件按钮加载数据");
        document.querySelector("#loading .spinner").style.display = "none";

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".xyz";
        fileInput.style.display = "none";
        fileInput.addEventListener("change", handleFileSelect);
        document.body.appendChild(fileInput);

        const selectBtn = document.createElement("button");
        selectBtn.textContent = text("selectFileButton", "选择XYZ文件");
        selectBtn.className = "btn";
        selectBtn.style.marginTop = "20px";
        selectBtn.onclick = function () {
            fileInput.click();
        };
        document.querySelector("#loading").appendChild(selectBtn);
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            document.querySelector("#loading .spinner").style.display = "block";
            document.querySelector("#loading p").textContent = text("processingText", "正在处理数据...");
            const btn = document.querySelector("#loading button");
            if (btn) {
                btn.remove();
            }

            setTimeout(function () {
                processXYZData(e.target.result);
            }, 50);
        };
        reader.readAsText(file);
    }

    function processXYZData(content) {
        const lines = content.trim().split("\n");

        const allPoints = [];
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].trim().split(/\s+/);
            if (parts.length >= 3) {
                const x = parseFloat(parts[0]);
                const y = parseFloat(parts[1]);
                const z = parseFloat(parts[2]);

                if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                    allPoints.push({ x: x, y: y, z: z });
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                    minZ = Math.min(minZ, z);
                    maxZ = Math.max(maxZ, z);
                }
            }
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        allPoints.forEach(function (p) {
            p.x -= centerX;
            p.y -= centerY;
            p.z -= centerZ;
        });

        originalPositions = new Float32Array(allPoints.length * 3);
        particleColors = new Float32Array(allPoints.length * 3);

        const rangeZ = maxZ - minZ || 1;

        for (let i = 0; i < allPoints.length; i++) {
            const p = allPoints[i];
            originalPositions[i * 3] = p.x;
            originalPositions[i * 3 + 1] = p.y;
            originalPositions[i * 3 + 2] = p.z;

            const zNorm = (p.z - (minZ - centerZ)) / rangeZ;
            const hue = 0.5 + zNorm * 0.2;
            const color = new THREE.Color();
            color.setHSL(Math.max(0, Math.min(1, hue)), 0.9, 0.6);
            particleColors[i * 3] = color.r;
            particleColors[i * 3 + 1] = color.g;
            particleColors[i * 3 + 2] = color.b;
        }

        document.getElementById("original-count").textContent = allPoints.length;
        updateParticleDensity();

        document.getElementById("loading").classList.add("hidden");
    }

    function updateParticleDensity() {
        if (!originalPositions) {
            return;
        }

        const density = parseFloat(document.getElementById("particle-density").value);
        const totalPoints = originalPositions.length / 3;
        const displayCount = Math.max(100, Math.floor(totalPoints * density));

        displayIndices = [];
        const step = totalPoints / displayCount;
        for (let i = 0; i < displayCount; i++) {
            displayIndices.push(Math.floor(i * step));
        }

        currentPositions = new Float32Array(displayCount * 3);
        const displayColors = new Float32Array(displayCount * 3);

        for (let i = 0; i < displayCount; i++) {
            const idx = displayIndices[i];
            currentPositions[i * 3] = originalPositions[idx * 3];
            currentPositions[i * 3 + 1] = originalPositions[idx * 3 + 1];
            currentPositions[i * 3 + 2] = originalPositions[idx * 3 + 2];

            displayColors[i * 3] = particleColors[idx * 3];
            displayColors[i * 3 + 1] = particleColors[idx * 3 + 1];
            displayColors[i * 3 + 2] = particleColors[idx * 3 + 2];
        }

        createParticles(currentPositions, displayColors);
        document.getElementById("particle-count").textContent = displayCount;
    }

    function createParticles(positions, colors) {
        if (particles) {
            scene.remove(particles);
            particleGeometry.dispose();
        }

        particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        particleGeometry.userData.originalPositions = positions.slice();

        const texture = createParticleTexture();

        particleMaterial = new THREE.PointsMaterial({
            size: parseFloat(document.getElementById("particle-size").value),
            vertexColors: true,
            map: texture,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        particles = new THREE.Points(particleGeometry, particleMaterial);

        const box = new THREE.Box3().setFromObject(particles);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (camera.position.z < maxDim) {
            camera.position.z = maxDim * 1.5;
        }
        controls.minDistance = maxDim * 0.05;
        controls.maxDistance = maxDim * 8;

        scene.add(particles);
    }

    function createParticleTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.9)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.4)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        return new THREE.CanvasTexture(canvas);
    }

    function initMediaPipe() {
        hands = new Hands({
            locateFile: function (file) {
                return mediaPipeBasePath + file;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults(onHandsResults);
    }

    function onHandsResults(results) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            gestureHistory.push("none");
            if (gestureHistory.length > gestureHistorySize) {
                gestureHistory.shift();
            }

            if (continuousGestureActive) {
                continuousGestureActive = false;
                targetDiffusion = 0;
                updateGestureDisplay(text("gestureNone", "未检测到手势"), "inactive");
                hideGestureHint();
                hideGestureIndicator();
            }
            return;
        }

        const landmarks = results.multiHandLandmarks[0];
        const gesture = detectGestureImproved(landmarks);

        gestureHistory.push(gesture);
        if (gestureHistory.length > gestureHistorySize) {
            gestureHistory.shift();
        }

        const stableGesture = getStableGesture();

        if (stableGesture !== "none") {
            continuousGestureActive = true;

            if (stableGesture === "open") {
                targetScale = Math.min(targetScale * 1.04, 10.0);