/**
 * ASCIIRainBackground - Inherits from ASCIIBackgroundBase
 */
class ASCIIRainBackground extends ASCIIBackgroundBase {
    constructor(options = {}) {
        super({
            id: "ascii-rain-background",
            fontSize: options.fontSize ?? 15,
            rainDensity: options.rainDensity ?? 0.07,
            rainSpeed: options.rainSpeed ?? 20,
            puddleHeight: options.puddleHeight ?? 0.12,
            rippleLifetime: options.rippleLifetime ?? 1000,
            backgroundColor: options.backgroundColor ?? "transparent",
            textColor: options.textColor ?? "#FFFFFF",
            puddleColor: options.puddleColor ?? "#FFFFFF",
            opacity: options.opacity ?? 0.22,
            ...options
        });

        this.raindrops = [];
        this.ripples = [];
        this.spawnAccumulator = 0;
        this.rainCharacters = ["|", "|", "|", "'", ".", "│"];

        this.puddleStartRow = Math.floor(this.rows * (1 - this.options.puddleHeight));

        if (window.currentWeatherCondition) {
            this.setWeather(window.currentWeatherCondition, window.currentWeatherData);
        }
    }

    resize() {
        super.resize();
        this.puddleStartRow = Math.floor(this.rows * (1 - this.options.puddleHeight));
        if (this.raindrops) {
            this.raindrops = this.raindrops.filter(drop => drop.column < this.columns);
        }
        if (this.ripples) {
            this.ripples = this.ripples.filter(ripple => ripple.column < this.columns);
        }
    }

    setWeather(condition, weatherData) {
        if (!condition) return;
        const cond = condition.toLowerCase();

        if (cond.includes("thunder") || cond.includes("storm")) {
            this.options.rainDensity = 0.12;
            this.options.rainSpeed = 26;
            this.rainCharacters = ["|", "|", "│", "║", "\\"];
        } else if (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle")) {
            this.options.rainDensity = 0.08;
            this.options.rainSpeed = 20;
            this.rainCharacters = ["|", "|", "|", "'", ".", "│"];
        } else {
            this.options.rainDensity = 0.05;
            this.options.rainSpeed = 16;
            this.rainCharacters = ["|", "'", ".", "│"];
        }
    }

    spawnRaindrop() {
        const rainCharacters = this.rainCharacters || ["|", "|", "|", "'", ".", "│"];
        this.raindrops.push({
            column: Math.floor(Math.random() * this.columns),
            row: -Math.random() * 10,
            speed: this.options.rainSpeed * (0.65 + Math.random() * 0.8),
            character: rainCharacters[Math.floor(Math.random() * rainCharacters.length)],
            brightness: 0.4 + Math.random() * 0.6
        });
    }

    createRipple(column) {
        this.ripples.push({
            column,
            row: this.puddleStartRow + Math.floor(Math.random() * 2),
            age: 0,
            lifetime: this.options.rippleLifetime * (0.75 + Math.random() * 0.5),
            maxRadius: 2 + Math.floor(Math.random() * 5)
        });
    }

    update(deltaTime) {
        const seconds = deltaTime / 1000;
        const desiredDropsPerSecond = this.columns * this.options.rainDensity * this.options.rainSpeed;

        this.spawnAccumulator += desiredDropsPerSecond * seconds;

        while (this.spawnAccumulator >= 1) {
            this.spawnRaindrop();
            this.spawnAccumulator--;
        }

        const puddleAlpha = Math.max(0, 1 - this.scrollProgress * 2.2);
        const effectiveFloor = Math.floor(this.puddleStartRow + (this.rows - this.puddleStartRow) * (1 - puddleAlpha));

        for (const drop of this.raindrops) {
            drop.row += drop.speed * seconds;

            if (drop.row >= effectiveFloor) {
                if (puddleAlpha > 0.1 && drop.column < this.columns) {
                    this.createRipple(drop.column);
                }
                drop.dead = true;
            }
        }

        this.raindrops = this.raindrops.filter(drop => !drop.dead);

        for (const ripple of this.ripples) {
            ripple.age += deltaTime;
        }

        this.ripples = this.ripples.filter(ripple => ripple.age < ripple.lifetime);
    }

    draw(time) {
        const puddleAlpha = Math.max(0, 1 - this.scrollProgress * 2.2);
        const puddleColor = this.isNight ? "#9FB3D1" : (this.options.puddleColor || "#FFFFFF");
        const rainColor = this.isNight ? "#B0C4DE" : (this.options.textColor || "#FFFFFF");

        // 1. Draw Puddle
        if (puddleAlpha > 0.01) {
            const effectiveFloor = Math.floor(this.puddleStartRow + (this.rows - this.puddleStartRow) * (1 - puddleAlpha));
            const puddleChars = ["~", "≈", "-", " ", " "];

            for (let row = effectiveFloor; row < this.rows; row++) {
                const depthRatio = (row - effectiveFloor) / Math.max(1, this.rows - effectiveFloor);
                const rowAlpha = (0.35 + depthRatio * 0.65) * puddleAlpha;

                for (let col = 0; col < this.columns; col++) {
                    const noise = Math.sin(col * 0.35 + time * 0.0012) + Math.cos(row * 0.5 + time * 0.0008);
                    if (noise > 0.25) {
                        const char = puddleChars[Math.floor(Math.abs(noise * 3)) % puddleChars.length];
                        this.drawCharacter(char, col, row, puddleColor, rowAlpha * 0.5);
                    }
                }
            }
        }

        // 2. Draw Raindrops
        for (const drop of this.raindrops) {
            const row = Math.floor(drop.row);
            if (row >= 0 && row < this.rows) {
                this.drawCharacter(drop.character, drop.column, row, rainColor, drop.brightness);
            }
        }

        // 3. Draw Ripples
        for (const ripple of this.ripples) {
            const progress = ripple.age / ripple.lifetime;
            const currentRadius = Math.floor(progress * ripple.maxRadius);
            const alpha = (1 - progress) * puddleAlpha;

            if (alpha <= 0.01) continue;

            const leftCol = ripple.column - currentRadius;
            const rightCol = ripple.column + currentRadius;

            if (leftCol >= 0) this.drawCharacter("(", leftCol, ripple.row, puddleColor, alpha * 0.85);
            if (rightCol < this.columns) this.drawCharacter(")", rightCol, ripple.row, puddleColor, alpha * 0.85);

            for (let c = leftCol + 1; c < rightCol; c++) {
                if (c >= 0 && c < this.columns) {
                    this.drawCharacter("_", c, ripple.row, puddleColor, alpha * 0.7);
                }
            }
        }
    }
}

window.ASCIIRainBackground = ASCIIRainBackground;