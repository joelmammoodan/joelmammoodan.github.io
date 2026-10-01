/**
 * Base class for all ASCII Canvas Backgrounds
 */
class ASCIIBackgroundBase {
    constructor(options = {}) {
        this.options = {
            fontSize: options.fontSize ?? 15,
            backgroundColor: options.backgroundColor ?? "transparent",
            textColor: options.textColor ?? "#FFFFFF",
            opacity: options.opacity ?? 0.22,
            ...options
        };

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.className = "ascii-weather-bg-canvas";
        this.canvas.id = options.id || "ascii-weather-bg";

        Object.assign(this.canvas.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "1",
            opacity: String(this.options.opacity ?? 0.75),
            pointerEvents: "none"
        });

        const mount = () => {
            if (document.body) {
                document.body.prepend(this.canvas);
            } else {
                document.addEventListener("DOMContentLoaded", () => document.body.prepend(this.canvas));
            }
        };
        mount();

        this.columns = 0;
        this.rows = 0;
        this.characterWidth = 9;
        this.characterHeight = 16;
        this.scrollProgress = 0;
        this.isNight = false;

        this.lastTime = performance.now();
        this.running = true;

        this.onScroll = this.onScroll.bind(this);
        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);

        window.addEventListener("scroll", this.onScroll, { passive: true });
        window.addEventListener("resize", this.resize);

        this.onScroll();
        this.resize();
        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    onScroll() {
        const rootProgress = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll-progress'));
        if (!isNaN(rootProgress) && rootProgress > 0) {
            this.scrollProgress = Math.min(1, Math.max(0, rootProgress));
        } else {
            this.scrollProgress = Math.min(1, Math.max(0, window.scrollY / 180));
        }

        // Fade background out smoothly as user scrolls past the hero section
        const baseOpacity = this.options.opacity ?? 0.75;
        const scrollFade = Math.max(0, 1 - this.scrollProgress * 1.5);
        if (this.canvas) {
            this.canvas.style.opacity = String(baseOpacity * scrollFade);
        }
    }

    setDayNight(isNight) {
        this.isNight = isNight;
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

        this.characterWidth = this.ctx.measureText("M").width || this.options.fontSize * 0.6;
        this.characterHeight = this.options.fontSize * 1.15;

        this.columns = Math.ceil(window.innerWidth / this.characterWidth);
        this.rows = Math.ceil(window.innerHeight / this.characterHeight);
    }

    drawCharacter(character, column, row, color = null, alpha = 1) {
        if (column < 0 || column >= this.columns || row < 0 || row >= this.rows) {
            return;
        }

        const x = Math.round(column * this.characterWidth);
        const y = Math.round(row * this.characterHeight);

        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        this.ctx.fillStyle = color || (this.isNight ? "#C5D3E8" : this.options.textColor);
        this.ctx.fillText(character, x, y);
    }

    drawString(text, startCol, startRow, color = null, alpha = 1) {
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char !== " ") {
                this.drawCharacter(char, startCol + i, startRow, color, alpha);
            }
        }
    }

    drawAsciiMatrix(asciiArtLines, startCol, startRow, color = null, alpha = 1) {
        for (let r = 0; r < asciiArtLines.length; r++) {
            const line = asciiArtLines[r];
            this.drawString(line, startCol, startRow + r, color, alpha);
        }
    }

    update(deltaTime) {
        // Implemented by child classes
    }

    draw(time) {
        // Implemented by child classes
    }

    animate(currentTime) {
        if (!this.running) return;

        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;

        this.update(deltaTime);

        // Save & reset transform to clear full buffer cleanly
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.options.backgroundColor && this.options.backgroundColor !== "transparent") {
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = this.options.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.restore();

        // Ensure font state
        this.ctx.font = `${this.options.fontSize}px monospace`;
        this.ctx.textBaseline = "top";

        this.draw(currentTime);
        this.ctx.globalAlpha = 1;

        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    destroy() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        window.removeEventListener("resize", this.resize);
        window.removeEventListener("scroll", this.onScroll);
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.remove();
        }
    }
}

window.ASCIIBackgroundBase = ASCIIBackgroundBase;
