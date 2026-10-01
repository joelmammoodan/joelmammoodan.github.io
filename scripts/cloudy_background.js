/**
 * ASCIICloudyBackground - Drifting Clouds, Ground Landscape & Interactive "UP" Balloon House Scene
 */
class ASCIICloudyBackground extends ASCIIBackgroundBase {
    constructor(options = {}) {
        super({
            id: "ascii-cloudy-background",
            fontSize: options.fontSize ?? 15,
            opacity: options.opacity ?? 0.75,
            enableFloatingHouse: options.enableFloatingHouse ?? true,
            ...options
        });

        this.clouds = [];
        this.stars = [];
        this.poppedParticles = [];
        this.mousePos = { col: Math.floor(this.columns * 0.5), row: Math.floor(this.rows * 0.3) };
        this.prevMousePos = { col: Math.floor(this.columns * 0.5), row: Math.floor(this.rows * 0.3) };
        this.mouseSpeed = 0;
        this.hasUserInteractedMouse = false;

        // Interactive Balloon House State
        this.house = {
            xCol: Math.floor(this.columns * 0.5),
            yRow: Math.floor(this.rows * 0.3),
            vx: 0,
            vy: 0,
            bobOffset: 0,
            tilt: 0,
            clicksRemaining: Math.floor(Math.random() * 11) + 10, // 10 to 20 clicks
            totalClicks: 0,
            isPopped: false,
            isGrounded: false,
            balloonShrinkRatio: 1.0,
            fallVelocity: 0,
            baseSpeedX: 0.025,
            baseSpeedY: 0.020,
            popEffects: []
        };
        this.house.totalClicks = this.house.clicksRemaining;

        // Gyroscope / Device orientation tilt offsets
        this.gyroOffset = { x: 0, y: 0 };
        this.hasGyro = false;

        this.initClouds();
        this.initStars();
        this.initGroundAndFlora();

        // Bind interactive event handlers
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onDeviceOrientation = this.onDeviceOrientation.bind(this);

        window.addEventListener("mousemove", this.onMouseMove, { passive: true });
        window.addEventListener("touchmove", this.onTouchMove, { passive: true });
        window.addEventListener("touchstart", this.onPointerDown, { passive: true });
        window.addEventListener("pointerdown", this.onPointerDown);
        
        // Listen to mobile device orientation (gyroscope)
        if (window.DeviceOrientationEvent) {
            // Check for iOS permission requirement if needed on first interaction
            window.addEventListener("deviceorientation", this.onDeviceOrientation, { passive: true });
        }
    }

    onDeviceOrientation(e) {
        // gamma: Left-to-right tilt in degrees [-90, 90]
        // beta: Front-to-back tilt in degrees [-180, 180]
        if (e.gamma !== null && e.beta !== null) {
            this.hasGyro = true;
            // Normalize tilt: clamp and map to grid column / row offsets
            const tiltX = Math.max(-45, Math.min(45, e.gamma));
            const tiltY = Math.max(0, Math.min(60, e.beta - 25)); // resting phone angle ~25-45 deg

            // Target smooth gyro offset in character columns/rows
            this.gyroOffset.x = (tiltX / 45) * (this.columns * 0.28);
            this.gyroOffset.y = ((tiltY - 20) / 40) * (this.rows * 0.16);
        }
    }

    onTouchMove(e) {
        if (!e.touches || e.touches.length === 0) return;
        this.hasUserInteractedMouse = true;
        const touch = e.touches[0];
        const curCol = Math.floor(touch.clientX / this.characterWidth);
        const curRow = Math.floor(touch.clientY / this.characterHeight);

        const dCol = curCol - this.mousePos.col;
        const dRow = curRow - this.mousePos.row;
        const instantSpeed = Math.sqrt(dCol * dCol + dRow * dRow);

        this.mouseSpeed = this.mouseSpeed * 0.4 + instantSpeed * 0.8;

        this.prevMousePos.col = this.mousePos.col;
        this.prevMousePos.row = this.mousePos.row;
        this.mousePos.col = curCol;
        this.mousePos.row = curRow;
    }

    onMouseMove(e) {
        this.hasUserInteractedMouse = true;
        const curCol = Math.floor(e.clientX / this.characterWidth);
        const curRow = Math.floor(e.clientY / this.characterHeight);

        // Measure cursor instantaneous speed
        const dCol = curCol - this.mousePos.col;
        const dRow = curRow - this.mousePos.row;
        const instantSpeed = Math.sqrt(dCol * dCol + dRow * dRow);

        this.mouseSpeed = this.mouseSpeed * 0.4 + instantSpeed * 0.6; // smooth running speed

        this.prevMousePos.col = this.mousePos.col;
        this.prevMousePos.row = this.mousePos.row;
        this.mousePos.col = curCol;
        this.mousePos.row = curRow;
    }

    onPointerDown(e) {
        // Request iOS gyroscope permission on user gesture if available
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(response => {
                if (response === 'granted') {
                    window.addEventListener("deviceorientation", this.onDeviceOrientation, { passive: true });
                }
            }).catch(() => {});
        }

        if (this.house.isPopped || !this.options.enableFloatingHouse) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const isTouch = !!e.touches || e.pointerType === 'touch';

        const clickCol = Math.floor(clientX / this.characterWidth);
        const clickRow = Math.floor(clientY / this.characterHeight);

        // Track touch position as well for evasion
        this.hasUserInteractedMouse = true;
        this.mousePos.col = clickCol;
        this.mousePos.row = clickRow;
        this.mouseSpeed = 4.0; // trigger immediate evasion impulse

        const rootCol = Math.floor(this.house.xCol);
        const rootRow = Math.floor(this.house.yRow + this.house.bobOffset);

        // Precise Balloon Bouquet dimensions (touch gets larger comfortable hitbox)
        const shrink = this.house.balloonShrinkRatio;
        const touchMultiplier = isTouch ? 1.6 : 1.0;
        const clusterRadiusX = Math.max(2.5, 7.5 * shrink * touchMultiplier);
        const clusterRadiusY = Math.max(2.5, 4.8 * shrink * touchMultiplier);
        const clusterCenterCol = rootCol;
        const clusterCenterRow = rootRow - Math.floor(8 * shrink);

        // Ellipse hit detection
        const dCol = (clickCol - clusterCenterCol) / clusterRadiusX;
        const dRow = (clickRow - clusterCenterRow) / clusterRadiusY;
        const distSq = dCol * dCol + dRow * dRow;

        // Inside balloon perimeter
        if (distSq <= 1.0 && clickRow <= (rootRow - (isTouch ? 1 : 3))) {
            this.handleBalloonClick(clickCol, clickRow);
        }
    }

    triggerHapticRumble(type = 'pop') {
        if (!navigator.vibrate) return;
        try {
            if (type === 'pop') {
                // Multi-pulse flutter rumble simulating multiple balloons popping in a bunch
                navigator.vibrate([25, 20, 35, 25, 45]);
            } else if (type === 'crash') {
                // Heavy landing rumble
                navigator.vibrate([60, 40, 90, 50, 120]);
            }
        } catch (_) {}
    }

    handleBalloonClick(clickCol, clickRow) {
        this.house.clicksRemaining--;
        this.house.balloonShrinkRatio = Math.max(0.2, this.house.clicksRemaining / this.house.totalClicks);

        // Haptic rumble vibration for multiple balloons bursting
        this.triggerHapticRumble('pop');

        // Spawn pop sparkle particles for this click
        const popChars = ["*", "x", "+", "°", "·", "!", "%"];
        const colors = ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#FF924C", "#FFFFFF"];
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10 + (Math.random() * 0.4);
            const speed = 4 + Math.random() * 8;
            this.poppedParticles.push({
                x: clickCol,
                y: clickRow,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                char: popChars[Math.floor(Math.random() * popChars.length)],
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.0,
                age: 0,
                maxAge: 0.5 + Math.random() * 0.3
            });
        }

        // Slight pop recoil
        this.house.yRow += 0.5;
        this.house.bobOffset += (Math.random() - 0.5) * 2;

        // If clicks depleted, completely pop everything and plummet!
        if (this.house.clicksRemaining <= 0) {
            this.house.isPopped = true;
            this.house.balloonShrinkRatio = 0;
            this.house.fallVelocity = 2; // initial drop kick

            // Massive pop explosion
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 6 + Math.random() * 16;
                this.poppedParticles.push({
                    x: clickCol,
                    y: clickRow,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 4,
                    char: popChars[Math.floor(Math.random() * popChars.length)],
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1.0,
                    age: 0,
                    maxAge: 0.8 + Math.random() * 0.5
                });
            }
        }
    }

    initGroundAndFlora() {
        this.trees = [];
        this.plants = [];

        const treeTemplates = [
            // Pine / Fir Tree
            [
                "   /\\   ",
                "  /^^\\  ",
                " /^^^^\\ ",
                "   ||   "
            ],
            // Leafy Oak / Birch Tree
            [
                "  (####)  ",
                " (######) ",
                "  (####)  ",
                "    ||    "
            ],
            // Small Sapling / Bush
            [
                " (%%) ",
                "  ||  "
            ]
        ];

        const plantTemplates = [
            "\\|/",
            "v|v",
            "*|*",
            ".|.",
            " Y ",
            "vv"
        ];

        const treeCount = Math.max(3, Math.floor(this.columns / 22));
        for (let i = 0; i < treeCount; i++) {
            const col = Math.floor((this.columns / (treeCount + 1)) * (i + 1) + (Math.random() * 8 - 4));
            const template = treeTemplates[Math.floor(Math.random() * treeTemplates.length)];
            const groundY = this.getHillHeight(col);
            this.trees.push({
                col,
                row: groundY - template.length + 1,
                template,
                color: this.isNight ? "#455A64" : "#4CAF50"
            });
        }

        const plantCount = Math.max(6, Math.floor(this.columns / 8));
        for (let i = 0; i < plantCount; i++) {
            const col = Math.floor(Math.random() * this.columns);
            const plantStr = plantTemplates[Math.floor(Math.random() * plantTemplates.length)];
            const groundY = this.getHillHeight(col);
            this.plants.push({
                col,
                row: groundY,
                str: plantStr,
                color: this.isNight ? "#78909C" : (Math.random() > 0.4 ? "#81C784" : "#FFD54F")
            });
        }
    }

    getHillHeight(col) {
        const baseRow = Math.floor(this.rows * 0.85);
        const wave1 = Math.sin(col * 0.05) * 2;
        const wave2 = Math.cos(col * 0.12) * 1;
        return Math.floor(baseRow + wave1 + wave2);
    }

    initStars() {
        this.stars = [];
        const starCount = Math.floor(this.columns * 0.4);
        const starChars = [".", "·", "°", "*", "✦", "+"];

        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                col: Math.floor(Math.random() * this.columns),
                row: Math.floor(Math.random() * Math.max(1, this.rows * 0.65)),
                char: starChars[Math.floor(Math.random() * starChars.length)],
                alpha: 0.2 + Math.random() * 0.7,
                twinkleSpeed: 0.002 + Math.random() * 0.005,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }

    initClouds() {
        this.clouds = [];
        const cloudCount = Math.max(4, Math.floor(this.columns / 25));

        for (let i = 0; i < cloudCount; i++) {
            this.clouds.push({
                col: (Math.random() * this.columns * 1.5) - (this.columns * 0.25),
                row: 2 + Math.floor(Math.random() * (this.rows * 0.5)),
                width: 14 + Math.floor(Math.random() * 22),
                height: 3 + Math.floor(Math.random() * 4),
                speed: 0.8 + Math.random() * 1.8,
                layer: Math.floor(Math.random() * 3),
                density: 0.4 + Math.random() * 0.4
            });
        }
    }

    resize() {
        super.resize();
        this.initClouds();
        this.initStars();
        this.initGroundAndFlora();
    }

    update(deltaTime) {
        const seconds = deltaTime / 1000;
        const time = performance.now() * 0.001;

        // 1. Update Clouds drifting from left to right
        for (const cloud of this.clouds) {
            cloud.col += cloud.speed * seconds;
            if (cloud.col - cloud.width > this.columns) {
                cloud.col = -cloud.width - (Math.random() * 10);
                cloud.row = 2 + Math.floor(Math.random() * (this.rows * 0.55));
            }
        }

        // 2. Update Pop Particle physics
        for (const p of this.poppedParticles) {
            p.age += seconds;
            p.x += p.vx * seconds;
            p.vy += 20 * seconds; // gravity
            p.y += p.vy * seconds;
            p.alpha = Math.max(0, 1 - p.age / p.maxAge);
        }
        this.poppedParticles = this.poppedParticles.filter(p => p.age < p.maxAge);

        // 3. Update UP Balloon House Physics & Cursor Following
        if (this.options.enableFloatingHouse) {
            if (!this.house.isPopped) {
                // Smooth sinusoidal natural bobbing
                this.house.bobOffset = Math.sin(time * 1.5) * 1.5 + Math.cos(time * 0.7) * 0.8;

                // Natural ambient wandering across the sky
                let targetX = (this.columns * 0.5) + Math.sin(time * 0.35 + 1.2) * (this.columns * 0.32) + Math.cos(time * 0.18) * (this.columns * 0.15);
                let targetY = (this.rows * 0.28) + Math.cos(time * 0.42 + 0.8) * (this.rows * 0.14) + Math.sin(time * 0.2) * (this.rows * 0.06);

                // Apply mobile gyroscope / device tilt influence
                if (this.hasGyro) {
                    targetX += this.gyroOffset.x;
                    targetY += this.gyroOffset.y;
                }

                let dynamicEaseSpeedX = this.house.baseSpeedX;
                let dynamicEaseSpeedY = this.house.baseSpeedY;

                // Dynamic speed-matched evasion from mouse / touch
                if (this.hasUserInteractedMouse) {
                    const dxCursor = this.house.xCol - this.mousePos.col;
                    const dyCursor = this.house.yRow - this.mousePos.row;
                    const distCursor = Math.sqrt(dxCursor * dxCursor + dyCursor * dyCursor);

                    // Evasion boundary (triggers within ~24 character units)
                    if (distCursor < 24 && distCursor > 0.01) {
                        // The closer the cursor AND the faster it moves, the more violently/quickly the house darts away
                        const proximityFactor = (1 - distCursor / 24); // 0 to 1
                        const speedFactor = Math.min(3.5, 1 + this.mouseSpeed * 0.35); // increases with fast mouse motion
                        
                        const evadeForce = proximityFactor * 22 * speedFactor;
                        targetX += (dxCursor / distCursor) * evadeForce;
                        targetY += (dyCursor / distCursor) * (evadeForce * 0.7);

                        // If the cursor is moving fast, increase the house's reaction speed dramatically!
                        dynamicEaseSpeedX = Math.min(0.16, this.house.baseSpeedX * (1 + proximityFactor * 3 * speedFactor));
                        dynamicEaseSpeedY = Math.min(0.12, this.house.baseSpeedY * (1 + proximityFactor * 3 * speedFactor));
                    }
                }

                // Slowly decay mouseSpeed back to 0
                this.mouseSpeed *= 0.92;

                // Keep house inside viewable airspace
                targetX = Math.max(6, Math.min(this.columns - 6, targetX));
                targetY = Math.max(5, Math.min(this.rows * 0.52, targetY));

                // Aerodynamic easing with dynamic reaction speed
                this.house.xCol += (targetX - this.house.xCol) * dynamicEaseSpeedX;
                this.house.yRow += (targetY - this.house.yRow) * dynamicEaseSpeedY;

                // Dynamic tilt based on evasion acceleration + gyro tilt
                const dx = targetX - this.house.xCol;
                const gyroTiltInfluence = this.hasGyro ? (this.gyroOffset.x * 0.02) : 0;
                this.house.tilt = Math.max(-0.4, Math.min(0.4, dx * 0.03 + gyroTiltInfluence));
            } else if (!this.house.isGrounded) {
                // Free fall physics
                this.house.fallVelocity += 35 * seconds; // acceleration
                this.house.yRow += this.house.fallVelocity * seconds;
                this.house.bobOffset = 0;

                const groundRow = this.getHillHeight(Math.floor(this.house.xCol)) - 6;
                if (this.house.yRow >= groundRow) {
                    this.house.yRow = groundRow;
                    this.house.isGrounded = true;
                    this.house.fallVelocity = 0;

                    // Heavy crash landing rumble
                    this.triggerHapticRumble('crash');

                    // Landing impact dust particles
                    const dustChars = [".", ",", "*", "o"];
                    for (let i = 0; i < 15; i++) {
                        const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
                        const spd = 4 + Math.random() * 8;
                        this.poppedParticles.push({
                            x: this.house.xCol + (Math.random() - 0.5) * 10,
                            y: groundRow + 5,
                            vx: Math.cos(angle) * spd,
                            vy: Math.sin(angle) * spd,
                            char: dustChars[Math.floor(Math.random() * dustChars.length)],
                            color: this.isNight ? "#607D8B" : "#8D6E63",
                            alpha: 0.8,
                            age: 0,
                            maxAge: 0.6
                        });
                    }
                }
            }
        }
    }

    drawCloud(cloud) {
        const cloudChars = ["@", "%", "#", "(", ")", "~", "o", "O", "8"];
        const cloudBaseColor = this.isNight ? "#8899B5" : "#FFFFFF";
        const layerAlpha = cloud.layer === 0 ? 0.25 : (cloud.layer === 1 ? 0.45 : 0.75);

        for (let r = 0; r < cloud.height; r++) {
            const normalizedY = (r / cloud.height) * 2 - 1;
            const rowWidth = Math.floor(cloud.width * Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)));
            const startC = Math.floor(cloud.col - rowWidth / 2);

            for (let c = 0; c < rowWidth; c++) {
                const colPos = startC + c;
                if (colPos >= 0 && colPos < this.columns) {
                    const rowPos = Math.floor(cloud.row + r);
                    if (rowPos >= 0 && rowPos < this.rows) {
                        const edgeDist = Math.min(c, rowWidth - 1 - c);
                        const isEdge = edgeDist <= 1 || r === 0 || r === cloud.height - 1;
                        const char = isEdge ? (edgeDist === 0 ? (c < rowWidth / 2 ? "(" : ")") : "~") : cloudChars[(c + r) % cloudChars.length];
                        
                        this.drawCharacter(char, colPos, rowPos, cloudBaseColor, layerAlpha * (isEdge ? 0.5 : 0.85));
                    }
                }
            }
        }
    }

    drawUPHouseAndBalloons(time) {
        const rootCol = Math.floor(this.house.xCol);
        const rootRow = Math.floor(this.house.yRow + this.house.bobOffset);

        const balloonPaletteDay = ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93", "#FF924C", "#FFFFFF"];
        const balloonPaletteNight = ["#9FA8DA", "#80DEEA", "#B39DDB", "#90CAF9", "#E1BEE7", "#C5CAE9"];
        const palette = this.isNight ? balloonPaletteNight : balloonPaletteDay;

        // 1. Draw Balloon Bouquet (if not popped)
        if (!this.house.isPopped && this.house.balloonShrinkRatio > 0) {
            const baseRadX = 8 * this.house.balloonShrinkRatio;
            const baseRadY = 5 * this.house.balloonShrinkRatio;
            const balloonClusterRadiusX = Math.max(2, Math.floor(baseRadX));
            const balloonClusterRadiusY = Math.max(2, Math.floor(baseRadY));
            const clusterCenterCol = rootCol;
            const clusterCenterRow = rootRow - Math.floor(8 * this.house.balloonShrinkRatio);

            const balloonTokens = ["O", "o", "0", "@", "( )", "()", "Q", "8"];

            for (let dy = -balloonClusterRadiusY; dy <= balloonClusterRadiusY; dy++) {
                const normalizedY = dy / balloonClusterRadiusY;
                const rowRadiusX = Math.floor(balloonClusterRadiusX * Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)));

                for (let dx = -rowRadiusX; dx <= rowRadiusX; dx++) {
                    const col = clusterCenterCol + dx;
                    const row = clusterCenterRow + dy;

                    if (col >= 0 && col < this.columns && row >= 0 && row < this.rows) {
                        const noise = Math.sin(dx * 1.7 + dy * 2.3 + time * 0.002);
                        const colorIndex = Math.abs(Math.floor((dx * 3 + dy * 5 + 20) % palette.length));
                        const char = balloonTokens[Math.abs(Math.floor(noise * 10)) % balloonTokens.length];
                        const alpha = 0.85 + Math.sin(dx + dy) * 0.15;

                        this.drawCharacter(char, col, row, palette[colorIndex], alpha);
                    }
                }
            }

            // 2. Draw Balloon Ropes
            const roofAnchorCol = rootCol;
            const roofAnchorRow = rootRow;
            const ropePoints = [
                { c: clusterCenterCol - Math.floor(5 * this.house.balloonShrinkRatio), r: clusterCenterRow + Math.floor(4 * this.house.balloonShrinkRatio) },
                { c: clusterCenterCol - Math.floor(2 * this.house.balloonShrinkRatio), r: clusterCenterRow + Math.floor(5 * this.house.balloonShrinkRatio) },
                { c: clusterCenterCol + Math.floor(2 * this.house.balloonShrinkRatio), r: clusterCenterRow + Math.floor(5 * this.house.balloonShrinkRatio) },
                { c: clusterCenterCol + Math.floor(5 * this.house.balloonShrinkRatio), r: clusterCenterRow + Math.floor(4 * this.house.balloonShrinkRatio) },
            ];

            const stringColor = this.isNight ? "#78909C" : "#D7CCC8";
            for (const pt of ropePoints) {
                const steps = Math.max(1, roofAnchorRow - pt.r);
                for (let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    const curC = Math.round(pt.c + (roofAnchorCol - pt.c) * t);
                    const curR = Math.round(pt.r + (roofAnchorRow - pt.r) * t);
                    const char = curC < roofAnchorCol ? "\\" : (curC > roofAnchorCol ? "/" : "|");
                    this.drawCharacter(char, curC, curR, stringColor, 0.6);
                }
            }
        }

        // 3. Draw The UP Cottage
        const houseLines = [
            "    /\\_|_     ",
            "   /     \\ |#|",
            "  /  [+]  \\| |",
            " |  _   _  |  ",
            " | [ ] [ ] |  ",
            " |_____[#]_|  "
        ];

        const houseColor = this.isNight ? "#B0BEC5" : "#FFE0B2";
        const windowGlow = this.isNight ? "#FFE082" : "#80D8FF";

        for (let r = 0; r < houseLines.length; r++) {
            const line = houseLines[r];
            const startC = rootCol - Math.floor(line.length / 2);
            for (let c = 0; c < line.length; c++) {
                const char = line[c];
                if (char !== " ") {
                    const colPos = startC + c;
                    const rowPos = rootRow + r;
                    const isWindow = char === "[" || char === "]" || char === "+" || char === "#";
                    this.drawCharacter(char, colPos, rowPos, isWindow ? windowGlow : houseColor, isWindow ? 1.0 : 0.85);
                }
            }
        }
    }

    draw(time) {
        // 1. Starfield at Night
        if (this.isNight) {
            for (const star of this.stars) {
                const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
                const starAlpha = star.alpha * (0.6 + twinkle * 0.4);
                this.drawCharacter(star.char, star.col, star.row, "#E0E6ED", starAlpha);
            }
        }

        // 2. Background Cloud Layers
        for (const cloud of this.clouds) {
            if (cloud.layer <= 1) {
                this.drawCloud(cloud);
            }
        }

        // 3. Ground Hills, Trees & Plants
        const groundColor = this.isNight ? "#263238" : "#81C784";
        const grassChars = [".", ",", "\"", "'", " "];

        for (let c = 0; c < this.columns; c++) {
            const hillY = this.getHillHeight(c);
            for (let r = hillY; r < this.rows; r++) {
                if (r === hillY) {
                    const grassTop = (c % 2 === 0) ? "^" : "~";
                    this.drawCharacter(grassTop, c, r, groundColor, 0.9);
                } else if (r === hillY + 1) {
                    const grassBlade = grassChars[(c + r) % grassChars.length];
                    this.drawCharacter(grassBlade, c, r, groundColor, 0.6);
                }
            }
        }

        // Draw Trees & Plants
        for (const tree of this.trees) {
            this.drawAsciiMatrix(tree.template, tree.col, tree.row, tree.color, 0.95);
        }
        for (const plant of this.plants) {
            this.drawString(plant.str, plant.col, plant.row, plant.color, 0.9);
        }

        // 4. Pop Explosion Particles
        for (const p of this.poppedParticles) {
            this.drawCharacter(p.char, Math.floor(p.x), Math.floor(p.y), p.color, p.alpha);
        }

        // 5. Draw UP House
        if (this.options.enableFloatingHouse) {
            this.drawUPHouseAndBalloons(time);
        }

        // 6. Foreground Cloud Layer
        for (const cloud of this.clouds) {
            if (cloud.layer === 2) {
                this.drawCloud(cloud);
            }
        }
    }

    destroy() {
        super.destroy();
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("touchmove", this.onTouchMove);
        window.removeEventListener("touchstart", this.onPointerDown);
        window.removeEventListener("pointerdown", this.onPointerDown);
        window.removeEventListener("deviceorientation", this.onDeviceOrientation);
    }
}

window.ASCIICloudyBackground = ASCIICloudyBackground;
