class ASCIIRainBackground {
    constructor(options = {}) {
        this.options = {
            fontSize: options.fontSize ?? 16,
            rainDensity: options.rainDensity ?? 0.08,
            rainSpeed: options.rainSpeed ?? 18,
            puddleHeight: options.puddleHeight ?? 0.12,
            rippleLifetime: options.rippleLifetime ?? 900,
            backgroundColor: options.backgroundColor ?? "transparent",
            textColor: options.textColor ?? "#FFFFFF",
            puddleColor: options.puddleColor ?? "#FFFFFF",
            opacity: options.opacity ?? 0.22
        };

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.id = "ascii-rain-background";

        Object.assign(this.canvas.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "2",
            opacity: String(this.options.opacity),
            pointerEvents: "none"
        });

        document.body.prepend(this.canvas);

        this.columns = 0;
        this.rows = 0;

        this.raindrops = [];
        this.ripples = [];

        this.lastTime = performance.now();
        this.spawnAccumulator = 0;

        this.scrollProgress = 0;
        this.onScroll = this.onScroll.bind(this);
        window.addEventListener("scroll", this.onScroll, { passive: true });
        this.onScroll();

        this.rainCharacters = ["|", "|", "|", "'", ".", "│"];
        if (window.currentWeatherCondition) {
            this.setWeather(window.currentWeatherCondition, window.currentWeatherData);
        }

        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);

        window.addEventListener("resize", this.resize);

        this.resize();
        requestAnimationFrame(this.animate);
    }

    onScroll() {
        const rootProgress = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll-progress'));
        if (!isNaN(rootProgress) && rootProgress > 0) {
            this.scrollProgress = Math.min(1, Math.max(0, rootProgress));
        } else {
            this.scrollProgress = Math.min(1, Math.max(0, window.scrollY / 180));
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
        } else if (cond.includes("cloud") || cond.includes("overcast")) {
            this.options.rainDensity = 0.04;
            this.options.rainSpeed = 15;
            this.rainCharacters = ["|", "'", ".", "·"];
        } else if (cond.includes("clear") || cond.includes("sun")) {
            this.options.rainDensity = 0.025;
            this.options.rainSpeed = 12;
            this.rainCharacters = [".", "'", "·", "°"];
        } else {
            this.options.rainDensity = 0.05;
            this.options.rainSpeed = 16;
            this.rainCharacters = ["|", "'", ".", "│"];
        }
    }

    resize() {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = window.innerWidth * pixelRatio;
        this.canvas.height = window.innerHeight * pixelRatio;

        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;

        this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        this.ctx.font = `${this.options.fontSize}px monospace`;
        this.ctx.textBaseline = "top";

        this.characterWidth =
            this.ctx.measureText("M").width || this.options.fontSize * 0.6;

        this.characterHeight = this.options.fontSize * 1.15;

        this.columns = Math.ceil(
            window.innerWidth / this.characterWidth
        );

        this.rows = Math.ceil(
            window.innerHeight / this.characterHeight
        );

        this.puddleStartRow = Math.floor(
            this.rows * (1 - this.options.puddleHeight)
        );

        this.raindrops = this.raindrops.filter(
            drop => drop.column < this.columns
        );

        this.ripples = this.ripples.filter(
            ripple => ripple.column < this.columns
        );
    }

    spawnRaindrop() {
        const rainCharacters = this.rainCharacters || ["|", "|", "|", "'", ".", "│"];

        this.raindrops.push({
            column: Math.floor(Math.random() * this.columns),
            row: -Math.random() * 10,
            speed:
                this.options.rainSpeed *
                (0.65 + Math.random() * 0.8),
            character:
                rainCharacters[
                Math.floor(Math.random() * rainCharacters.length)
                ],
            brightness: 0.4 + Math.random() * 0.6
        });
    }

    createRipple(column) {
        this.ripples.push({
            column,
            row:
                this.puddleStartRow +
                Math.floor(Math.random() * 2),
            age: 0,
            lifetime:
                this.options.rippleLifetime *
                (0.75 + Math.random() * 0.5),
            maxRadius: 2 + Math.floor(Math.random() * 5)
        });
    }

    update(deltaTime) {
        const seconds = deltaTime / 1000;

        const desiredDropsPerSecond =
            this.columns *
            this.options.rainDensity *
            this.options.rainSpeed;

        this.spawnAccumulator +=
            desiredDropsPerSecond * seconds;

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

        this.raindrops = this.raindrops.filter(
            drop => !drop.dead
        );

        for (const ripple of this.ripples) {
            ripple.age += deltaTime;
        }

        this.ripples = this.ripples.filter(
            ripple => ripple.age < ripple.lifetime
        );
    }

    drawCharacter(character, column, row, color, alpha = 1) {
        if (
            column < 0 ||
            column >= this.columns ||
            row < 0 ||
            row >= this.rows
        ) {
            return;
        }

        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;

        this.ctx.fillText(
            character,
            column * this.characterWidth,
            row * this.characterHeight
        );
    }

    drawRain() {
        for (const drop of this.raindrops) {
            const row = Math.floor(drop.row);

            this.drawCharacter(
                drop.character,
                drop.column,
                row,
                this.options.textColor,
                drop.brightness
            );

            if (drop.character === "|" || drop.character === "│") {
                this.drawCharacter(
                    ".",
                    drop.column,
                    row - 1,
                    this.options.textColor,
                    drop.brightness * 0.35
                );
            }
        }
    }

    getPuddleCharacter(column, row, time) {
        const wave =
            Math.sin(column * 0.42 + time * 0.0015) +
            Math.sin(column * 0.17 - time * 0.001);

        const distanceFromSurface = row - this.puddleStartRow;

        if (distanceFromSurface === 0) {
            if (wave > 1) return "~";
            if (wave < -1) return "_";
            return "-";
        }

        const noise =
            Math.sin(column * 0.91 + row * 1.73 + time * 0.0005);

        if (noise > 0.82) return ".";
        if (noise < -0.9) return "'";
        return " ";
    }

    drawPuddle(time) {
        const puddleAlpha = Math.max(0, 1 - this.scrollProgress * 2.2);
        if (puddleAlpha <= 0) return;
        for (
            let row = this.puddleStartRow;
            row < this.rows;
            row++
        ) {
            for (let column = 0; column < this.columns; column++) {
                const character = this.getPuddleCharacter(
                    column,
                    row,
                    time
                );

                if (character !== " ") {
                    const depth =
                        (row - this.puddleStartRow) /
                        Math.max(1, this.rows - this.puddleStartRow);

                    this.drawCharacter(
                        character,
                        column,
                        row,
                        this.options.puddleColor,
                        (0.65 - depth * 0.35) * puddleAlpha
                    );
                }
            }
        }
    }

    drawRipples() {
        const puddleAlpha = Math.max(0, 1 - this.scrollProgress * 2.2);
        if (puddleAlpha <= 0) return;
        for (const ripple of this.ripples) {
            const progress = ripple.age / ripple.lifetime;
            const radius = Math.max(
                1,
                Math.floor(progress * ripple.maxRadius)
            );

            const alpha = (1 - progress) * puddleAlpha;

            let leftCharacter = "(";
            let rightCharacter = ")";

            if (radius <= 1) {
                leftCharacter = "o";
                rightCharacter = "";
            } else if (radius >= ripple.maxRadius - 1) {
                leftCharacter = ".";
                rightCharacter = ".";
            }

            this.drawCharacter(
                leftCharacter,
                ripple.column - radius,
                ripple.row,
                this.options.textColor,
                alpha
            );

            if (rightCharacter) {
                this.drawCharacter(
                    rightCharacter,
                    ripple.column + radius,
                    ripple.row,
                    this.options.textColor,
                    alpha
                );
            }

            if (radius > 2 && progress < 0.7) {
                this.drawCharacter(
                    "_",
                    ripple.column,
                    ripple.row,
                    this.options.textColor,
                    alpha * 0.7
                );
            }
        }
    }

    draw(time) {
        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
        if (this.options.backgroundColor && this.options.backgroundColor !== "transparent") {
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = this.options.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.drawPuddle(time);
        this.drawRain();
        this.drawRipples();

        this.ctx.globalAlpha = 1;
    }

    animate(currentTime) {
        const deltaTime = Math.min(
            currentTime - this.lastTime,
            50
        );

        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw(currentTime);

        requestAnimationFrame(this.animate);
    }

    destroy() {
        window.removeEventListener("resize", this.resize);
        window.removeEventListener("scroll", this.onScroll);
        this.canvas.remove();
    }
}

const asciiRain = new ASCIIRainBackground({
    fontSize: 15,
    rainDensity: 0.07,
    rainSpeed: 20,
    puddleHeight: 0.12,
    rippleLifetime: 1000,
    backgroundColor: "transparent",
    textColor: "#FFFFFF",
    puddleColor: "#FFFFFF",
    opacity: 0.22
});

window.asciiRain = asciiRain;