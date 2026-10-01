/**
 * BackgroundManager - Controls Active Theme, .env keywords, and Day/Night cycle
 */
class BackgroundManager {
    constructor() {
        // Default environment values
        this.env = {
            mode: "auto",
            timeOfDay: "auto",
            opacity: 0.75,
            enableUpHouse: true,
            enableTumbleweed: true
        };

        this.currentTheme = null;
        this.activeInstance = null;
        this.isNight = false;
        this.lastWeatherCondition = "clear";
        this.lastWeatherData = null;

        // Immediate initial render
        this.updateDayNightState();
        this.applyConfiguredMode();

        // Load .env then re-apply overrides
        this.loadEnv().then(() => {
            this.updateDayNightState();
            this.applyConfiguredMode();
        });
    }

    async loadEnv() {
        // 1. Read from window.ENV_CONFIG (scripts/config.js) or window.__ENV__
        const envSource = window.ENV_CONFIG || window.__ENV__;
        if (envSource) {
            if (envSource.BACKGROUND_MODE || envSource.VITE_BACKGROUND_MODE) {
                this.env.mode = envSource.BACKGROUND_MODE || envSource.VITE_BACKGROUND_MODE;
            }
            if (envSource.TIME_OF_DAY || envSource.VITE_TIME_OF_DAY) {
                this.env.timeOfDay = envSource.TIME_OF_DAY || envSource.VITE_TIME_OF_DAY;
            }
            if (envSource.BACKGROUND_OPACITY || envSource.VITE_BACKGROUND_OPACITY) {
                this.env.opacity = parseFloat(envSource.BACKGROUND_OPACITY || envSource.VITE_BACKGROUND_OPACITY);
            }
            if (envSource.ENABLE_UP_HOUSE !== undefined || envSource.VITE_ENABLE_UP_HOUSE !== undefined) {
                const val = envSource.ENABLE_UP_HOUSE !== undefined ? envSource.ENABLE_UP_HOUSE : envSource.VITE_ENABLE_UP_HOUSE;
                this.env.enableUpHouse = (val !== false && val !== "false");
            }
            if (envSource.ENABLE_TUMBLEWEED !== undefined || envSource.VITE_ENABLE_TUMBLEWEED !== undefined) {
                const val = envSource.ENABLE_TUMBLEWEED !== undefined ? envSource.ENABLE_TUMBLEWEED : envSource.VITE_ENABLE_TUMBLEWEED;
                this.env.enableTumbleweed = (val !== false && val !== "false");
            }
        }

        // 2. Also fetch .env if hosted on HTTP
        if (window.location.protocol.startsWith("http")) {
            try {
                const res = await fetch(".env");
                if (res.ok) {
                    const text = await res.text();
                    const lines = text.split("\n");
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith("#")) continue;
                        const [key, ...vals] = trimmed.split("=");
                        const val = vals.join("=").trim().replace(/^["']|["']$/g, "");
                        
                        if (key.trim() === "VITE_BACKGROUND_MODE") this.env.mode = val;
                        if (key.trim() === "VITE_TIME_OF_DAY") this.env.timeOfDay = val;
                        if (key.trim() === "VITE_BACKGROUND_OPACITY") this.env.opacity = parseFloat(val);
                        if (key.trim() === "VITE_ENABLE_UP_HOUSE") this.env.enableUpHouse = (val !== "false");
                        if (key.trim() === "VITE_ENABLE_TUMBLEWEED") this.env.enableTumbleweed = (val !== "false");
                    }
                }
            } catch (err) {}
        }
    }

    updateDayNightState(weatherData = null) {
        if (weatherData) this.lastWeatherData = weatherData;

        if (this.env.timeOfDay === "day") {
            this.isNight = false;
        } else if (this.env.timeOfDay === "night") {
            this.isNight = true;
        } else {
            // Auto time of day
            if (this.lastWeatherData && this.lastWeatherData.sys && this.lastWeatherData.sys.sunrise && this.lastWeatherData.sys.sunset) {
                const now = Math.floor(Date.now() / 1000);
                this.isNight = !(now >= this.lastWeatherData.sys.sunrise && now < this.lastWeatherData.sys.sunset);
            } else {
                const hour = new Date().getHours();
                this.isNight = (hour < 6 || hour >= 18);
            }
        }

        // Sync Top-Center Circle Navbar (Sun/Moon)
        const navbar = document.getElementById("navbar");
        const navDot = document.getElementById("nav-dot");
        if (navbar) {
            if (this.isNight) {
                navbar.classList.add("moon-mode");
                navbar.classList.remove("sun-mode");
                navbar.setAttribute("title", "Nighttime (Moon Mode)");
                if (navDot) navDot.setAttribute("title", "Nighttime (Moon Mode)");
            } else {
                navbar.classList.add("sun-mode");
                navbar.classList.remove("moon-mode");
                navbar.setAttribute("title", "Daytime (Sun Mode)");
                if (navDot) navDot.setAttribute("title", "Daytime (Sun Mode)");
            }
        }

        if (this.activeInstance) {
            this.activeInstance.setDayNight(this.isNight);
        }
    }

    applyConfiguredMode() {
        const mode = this.env.mode.toLowerCase().trim();
        if (mode === "rain" || mode === "storm" || mode === "rainy") {
            this.setTheme("rain");
        } else if (mode === "cloud" || mode === "clouds" || mode === "cloudy" || mode === "up") {
            this.setTheme("cloudy");
        } else if (mode === "sun" || mode === "sunny" || mode === "clear" || mode === "desert") {
            this.setTheme("sunny");
        } else {
            // Auto mode
            this.setWeather(this.lastWeatherCondition, this.lastWeatherData);
        }
    }

    setWeather(condition, weatherData) {
        if (condition) this.lastWeatherCondition = condition;
        if (weatherData) this.lastWeatherData = weatherData;

        this.updateDayNightState(weatherData);

        // If manually locked to a keyword theme, do not override
        if (this.env.mode !== "auto") {
            return;
        }

        const cond = (condition || "").toLowerCase();

        if (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle") || cond.includes("thunder") || cond.includes("storm")) {
            this.setTheme("rain");
        } else if (cond.includes("cloud") || cond.includes("overcast") || cond.includes("fog") || cond.includes("mist") || cond.includes("haze")) {
            this.setTheme("cloudy");
        } else {
            // Default sunny/clear desert
            this.setTheme("sunny");
        }

        if (this.activeInstance && typeof this.activeInstance.setWeather === "function") {
            this.activeInstance.setWeather(condition, weatherData);
        }
    }

    setTheme(themeName) {
        if (this.currentTheme === themeName && this.activeInstance) {
            return;
        }

        if (this.activeInstance) {
            this.activeInstance.destroy();
            this.activeInstance = null;
        }

        this.currentTheme = themeName;
        const opts = {
            opacity: this.env.opacity,
            enableFloatingHouse: this.env.enableUpHouse,
            enableTumbleweed: this.env.enableTumbleweed
        };

        if (themeName === "rain") {
            this.activeInstance = new window.ASCIIRainBackground(opts);
        } else if (themeName === "cloudy") {
            this.activeInstance = new window.ASCIICloudyBackground(opts);
        } else if (themeName === "sunny") {
            this.activeInstance = new window.ASCIISunnyBackground(opts);
        }

        if (this.activeInstance) {
            this.activeInstance.setDayNight(this.isNight);
        }

        window.asciiRain = this.activeInstance; // Keep backwards compatibility
    }

    // Interactive helper for quick console/runtime changes
    setMode(modeKeyword) {
        this.env.mode = modeKeyword;
        this.applyConfiguredMode();
    }

    setTimeOfDay(timeKeyword) {
        this.env.timeOfDay = timeKeyword;
        this.updateDayNightState();
    }
}

// Global bootstrap
function initBackgroundManager() {
    if (!window.backgroundManager) {
        window.backgroundManager = new BackgroundManager();
        window.setBackgroundMode = (mode) => window.backgroundManager.setMode(mode);
        window.setTimeOfDay = (time) => window.backgroundManager.setTimeOfDay(time);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBackgroundManager);
} else {
    initBackgroundManager();
}
