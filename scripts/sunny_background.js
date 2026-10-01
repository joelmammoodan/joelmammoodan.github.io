/**
 * ASCIISunnyBackground - Desert Sand Dunes, Saguaros/Cacti, Sun Rays & Rolling Tumbleweeds
 */
class ASCIISunnyBackground extends ASCIIBackgroundBase {
    constructor(options = {}) {
        super({
            id: "ascii-sunny-background",
            fontSize: options.fontSize ?? 15,
            opacity: options.opacity ?? 0.25,
            enableTumbleweed: options.enableTumbleweed ?? true,
            ...options
        });

        this.cacti = [];
        this.tumbleweeds = [];
        this.stars = [];
        this.sunRays = [];
        this.tumbleweedSpawnTimer = 0;

        this.initTerrain();
        this.initStars();
        this.initSunRays();
    }

    initStars() {
        this.stars = [];
        const starCount = Math.floor(this.columns * 0.5);
        const starChars = [".", "·", "*", "✦", "°"];

        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                col: Math.floor(Math.random() * this.columns),
                row: Math.floor(Math.random() * Math.max(1, this.rows * 0.7)),
                char: starChars[Math.floor(Math.random() * starChars.length)],
                alpha: 0.3 + Math.random() * 0.7,
                twinkleSpeed: 0.003 + Math.random() * 0.004,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }

    initSunRays() {
        this.sunRays = [];
        const rayCount = 12;
        for (let i = 0; i < rayCount; i++) {
            this.sunRays.push({
                angle: (i / rayCount) * Math.PI + (Math.random() * 0.1),
                length: 15 + Math.random() * 20,
                speed: 0.0005 + Math.random() * 0.001,
                alpha: 0.2 + Math.random() * 0.4
            });
        }
    }

    getDuneHeight(col, layer = 0) {
        const baseRow = Math.floor(this.rows * (0.75 + layer * 0.08));
        const wave1 = Math.sin((col + layer * 15) * 0.04) * 3;
        const wave2 = Math.cos((col - layer * 8) * 0.08) * 1.5;
        return Math.floor(baseRow + wave1 + wave2);
    }

    initTerrain() {
        this.cacti = [];
        const cactusCount = Math.max(2, Math.floor(this.columns / 35));

        const cactusTemplates = [
            // Saguaro 1
            [
                " _  _ ",
                "| || |",
                "| || |_",
                "| |__/ |",
                " \\__   |",
                "    |  |",
                "    |  |"
            ],
            // Saguaro 2 (Small)
            [
                " _ ",
                "| | _",
                "| |/ |",
                " \\_  |",
                "   | |"
            ],
            // Prickly Bush
            [
                "  _|_  ",
                " /_|_\\ ",
                "   |   "
            ]
        ];

        for (let i = 0; i < cactusCount; i++) {
            const col = Math.floor((this.columns / (cactusCount + 1)) * (i + 1) + (Math.random() * 8 - 4));
            const template = cactusTemplates[Math.floor(Math.random() * cactusTemplates.length)];
            const duneRow = this.getDuneHeight(col, 1);

            this.cacti.push({
                col,
                row: duneRow - template.length + 1,
                template,
                color: this.isNight ? "#546E7A" : "#81C784"
            });
        }
    }

    spawnTumbleweed() {
        this.tumbleweeds.push({
            x: -5,
            y: this.getDuneHeight(0, 2) - 1,
            vx: 8 + Math.random() * 8, // horizontal rolling speed
            vy: -2 - Math.random() * 4, // initial bounce
            rotation: 0,
            rotSpeed: 5 + Math.random() * 5,
            radius: 1.5 + Math.random() * 0.8,
            frames: ["@", "%", "&", "#", "*", "O"]
        });
    }

    resize() {
        super.resize();
        this.initTerrain();
        this.initStars();
    }

    update(deltaTime) {
        const seconds = deltaTime / 1000;

        // 1. Tumbleweed Physics & Spawning
        if (this.options.enableTumbleweed) {
            this.tumbleweedSpawnTimer += seconds;
            if (this.tumbleweedSpawnTimer > 4.5 && Math.random() < 0.3) {
                this.spawnTumbleweed();
                this.tumbleweedSpawnTimer = 0;
            }

            for (const weed of this.tumbleweeds) {
                weed.x += weed.vx * seconds;
                weed.vy += 12 * seconds; // gravity
                weed.y += weed.vy * seconds;
                weed.rotation += weed.rotSpeed * seconds;

                const groundY = this.getDuneHeight(Math.floor(weed.x), 2) - weed.radius;
                if (weed.y >= groundY) {
                    weed.y = groundY;
                    weed.vy = -Math.abs(weed.vy) * 0.65; // bounce damping
                    if (Math.abs(weed.vy) < 1.0) {
                        weed.vy = -2.5 - Math.random() * 2; // wind push bounce
                    }
                }
            }

            this.tumbleweeds = this.tumbleweeds.filter(weed => weed.x < this.columns + 10);
        }
    }

    draw(time) {
        const duneCharSet = [".", ",", "_", "~", "-", " "];
        const sunCenterCol = Math.floor(this.columns / 2);
        const sunCenterRow = 3;

        // 1. Draw Starry Night or Sun Rays
        if (this.isNight) {
            for (const star of this.stars) {
                const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
                const starAlpha = star.alpha * (0.6 + twinkle * 0.4);
                this.drawCharacter(star.char, star.col, star.row, "#C5D3E8", starAlpha);
            }
        } else {
            // Heat haze / radiating subtle sun rays
            for (let r = 0; r < this.sunRays.length; r++) {
                const ray = this.sunRays[r];
                const currentAngle = ray.angle + Math.sin(time * ray.speed) * 0.15;
                for (let dist = 6; dist < ray.length; dist += 2) {
                    const col = Math.floor(sunCenterCol + Math.cos(currentAngle) * dist * 1.8);
                    const row = Math.floor(sunCenterRow + Math.sin(currentAngle) * dist);
                    const shimmer = Math.sin(col * 0.5 + time * 0.003);
                    if (col >= 0 && col < this.columns && row >= 0 && row < this.rows) {
                        this.drawCharacter(shimmer > 0 ? "\\" : "/", col, row, "#FFF59D", ray.alpha * 0.35);
                    }
                }
            }
        }

        // 2. Draw Multi-Layer Sand Dunes
        const duneColorsDay = ["#FFE082", "#FFD54F", "#FFCA28"];
        const duneColorsNight = ["#37474F", "#263238", "#1E272C"];
        const dunePalette = this.isNight ? duneColorsNight : duneColorsDay;

        for (let layer = 0; layer < 3; layer++) {
            const color = dunePalette[layer];
            for (let c = 0; c < this.columns; c++) {
                const duneRow = this.getDuneHeight(c, layer);
                for (let r = duneRow; r < this.rows; r++) {
                    if (r === duneRow) {
                        const ridgeChar = (c % 2 === 0) ? "~" : "_";
                        this.drawCharacter(ridgeChar, c, r, color, 0.9);
                    } else if (r === duneRow + 1) {
                        const grainChar = duneCharSet[(c + r) % duneCharSet.length];
                        this.drawCharacter(grainChar, c, r, color, 0.65);
                    }
                }
            }
        }

        // 3. Draw Cacti
        for (const cactus of this.cacti) {
            this.drawAsciiMatrix(cactus.template, cactus.col, cactus.row, cactus.color, 0.95);
        }

        // 4. Draw Rolling Tumbleweeds
        if (this.options.enableTumbleweed) {
            const weedColor = this.isNight ? "#90A4AE" : "#D7CCC8";
            for (const weed of this.tumbleweeds) {
                const col = Math.floor(weed.x);
                const row = Math.floor(weed.y);
                const frameIndex = Math.abs(Math.floor(weed.rotation)) % weed.frames.length;
                const char = weed.frames[frameIndex];
                this.drawCharacter(char, col, row, weedColor, 0.95);
            }
        }
    }
}

window.ASCIISunnyBackground = ASCIISunnyBackground;
