// Open-Meteo WMO Weather Code to Condition & Icon mapping (Keyless & Privacy-Safe)
function mapWmoCode(code, isDay = 1) {
    // 0: Clear sky
    if (code === 0) return { main: "Clear", description: "Clear sky", icon: isDay ? "01d" : "01n" };
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    if (code === 1) return { main: "Clear", description: "Mainly clear", icon: isDay ? "02d" : "02n" };
    if (code === 2) return { main: "Clouds", description: "Partly cloudy", icon: isDay ? "03d" : "03n" };
    if (code === 3) return { main: "Clouds", description: "Overcast", icon: isDay ? "04d" : "04n" };
    // 45, 48: Fog
    if (code === 45 || code === 48) return { main: "Atmosphere", description: "Foggy", icon: isDay ? "50d" : "50n" };
    // 51, 53, 55: Drizzle
    if (code >= 51 && code <= 55) return { main: "Drizzle", description: "Drizzle", icon: isDay ? "09d" : "09n" };
    // 61, 63, 65: Rain
    if (code >= 61 && code <= 65) return { main: "Rain", description: "Rain", icon: isDay ? "10d" : "10n" };
    // 71, 73, 75, 77: Snow
    if (code >= 71 && code <= 77) return { main: "Snow", description: "Snow", icon: isDay ? "13d" : "13n" };
    // 80, 81, 82: Rain showers
    if (code >= 80 && code <= 82) return { main: "Rain", description: "Rain showers", icon: isDay ? "09d" : "09n" };
    // 95, 96, 99: Thunderstorm
    if (code >= 95 && code <= 99) return { main: "Thunderstorm", description: "Thunderstorm", icon: isDay ? "11d" : "11n" };
    return { main: "Clouds", description: "Cloudy", icon: isDay ? "03d" : "03n" };
}

async function fetchWeatherDataByCoords(lat, lon, cityName = "Kochi", country = "IN") {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();

    const current = data.current || {};
    const daily = data.daily || {};
    const wmo = mapWmoCode(current.weather_code ?? 0, current.is_day ?? 1);

    const sunriseIso = daily.sunrise && daily.sunrise[0] ? daily.sunrise[0] : null;
    const sunsetIso = daily.sunset && daily.sunset[0] ? daily.sunset[0] : null;
    const sunriseTs = sunriseIso ? Math.floor(new Date(sunriseIso).getTime() / 1000) : null;
    const sunsetTs = sunsetIso ? Math.floor(new Date(sunsetIso).getTime() / 1000) : null;

    return {
        name: cityName,
        sys: {
            country: country,
            sunrise: sunriseTs,
            sunset: sunsetTs
        },
        weather: [
            {
                main: wmo.main,
                description: wmo.description,
                icon: wmo.icon
            }
        ],
        main: {
            temp: Math.round((current.temperature_2m ?? 28) * 10) / 10,
            feels_like: Math.round((current.apparent_temperature ?? current.temperature_2m ?? 28) * 10) / 10,
            humidity: Math.round(current.relative_humidity_2m ?? 75)
        },
        wind: {
            speed: Math.round((current.wind_speed_10m ?? 2.5) * 10) / 10
        }
    };
}

document.addEventListener("DOMContentLoaded", () => {

    // Celestial Sun/Moon mode for Navbar Circle
    function updateCelestialHeroCircle(weatherData) {
        const navbar = document.getElementById("navbar");
        const navDot = document.getElementById("nav-dot");
        if (!navbar) return;

        let isDay = false;
        if (weatherData && weatherData.sys && weatherData.sys.sunrise && weatherData.sys.sunset) {
            const now = Math.floor(Date.now() / 1000);
            isDay = (now >= weatherData.sys.sunrise && now < weatherData.sys.sunset);
        } else {
            const hour = new Date().getHours();
            isDay = (hour >= 6 && hour < 18);
        }

        if (isDay) {
            navbar.classList.add("sun-mode");
            navbar.classList.remove("moon-mode");
            navbar.setAttribute("title", "Daytime (Sun Mode)");
            if (navDot) navDot.setAttribute("title", "Daytime (Sun Mode)");
        } else {
            navbar.classList.add("moon-mode");
            navbar.classList.remove("sun-mode");
            navbar.setAttribute("title", "Nighttime (Moon Mode)");
            if (navDot) navDot.setAttribute("title", "Nighttime (Moon Mode)");
        }
    }

    updateCelestialHeroCircle();
    setInterval(() => updateCelestialHeroCircle(window.currentWeatherData), 60000);

    // 1. Fetch Weather for Navbar (Keyless via Open-Meteo, default to Kochi: 9.9312° N, 76.2673° E)
    fetchWeatherDataByCoords(9.9312, 76.2673, "Kochi", "IN")
        .then(data => {
            const weatherDiv = document.getElementById("weather");
            if (!weatherDiv) return;
            if (!data.weather || data.weather.length === 0) {
                weatherDiv.innerHTML = "<p>⚠ Weather data unavailable</p>";
                return;
            }
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
            const condition = data.weather[0].main;
            const humidity = data.main.humidity;
            const feelsLike = data.main.feels_like;
            const windSpeed = data.wind.speed;
            const locationName = `${data.name}, ${data.sys.country}`;

            weatherDiv.innerHTML = `
                <div class="weather-icon-wrapper">
                    <img src="${iconUrl}" alt="Weather" class='weather-icon'>
                </div>
                <div class="weather-text">
                    <p class="weather-temp">${data.main.temp}°C</p>
                    <p class="weather-location">${locationName}</p>
                    <p class="weather-details">${condition} | Feels like: ${feelsLike}°C</p>
                    <p class="weather-extra">Humidity: ${humidity}% | Wind: ${windSpeed} m/s</p>
                </div>
            `;
            if (typeof attachAsciiScrambleEffect === "function") {
                attachAsciiScrambleEffect(weatherDiv.querySelectorAll('.weather-text p'));
            }
            window.currentWeatherCondition = condition;
            window.currentWeatherData = data;
            updateCelestialHeroCircle(data);
            if (window.backgroundManager && typeof window.backgroundManager.setWeather === "function") {
                window.backgroundManager.setWeather(condition, data);
            } else if (window.asciiRain && typeof window.asciiRain.setWeather === "function") {
                window.asciiRain.setWeather(condition, data);
            }
        })
        .catch(error => {
            const weatherDiv = document.getElementById("weather");
            if (weatherDiv) weatherDiv.innerHTML = "<p>⚠</p>";
            console.error("Error fetching weather:", error);
        });

    const weatherFormEl = document.getElementById("weatherForm");
    const locationInputEl = document.getElementById("locationInput");
    if (weatherFormEl && locationInputEl) {
        weatherFormEl.addEventListener("submit", async (e) => {
            e.preventDefault();
            const searchCity = locationInputEl.value.trim();
            if (!searchCity) return;
            try {
                // Keyless geocoding lookup
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1&language=en&format=json`);
                const geoData = await geoRes.json();
                if (!geoData.results || geoData.results.length === 0) {
                    alert("City not found");
                    return;
                }
                const place = geoData.results[0];
                const data = await fetchWeatherDataByCoords(place.latitude, place.longitude, place.name, place.country_code || place.country);

                const cityNameEl = document.getElementById("cityName");
                const conditionEl = document.getElementById("condition");
                const tempEl = document.getElementById("temperature");
                const humidityEl = document.getElementById("humidity");
                const windEl = document.getElementById("wind");
                const iconEl = document.getElementById("weatherIcon");

                if (cityNameEl) cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
                if (conditionEl) conditionEl.textContent = data.weather[0].main;
                if (tempEl) tempEl.textContent = `${data.main.temp} °C`;
                if (humidityEl) humidityEl.textContent = `${data.main.humidity} %`;
                if (windEl) windEl.textContent = `${data.wind.speed} m/s`;
                if (iconEl && data.weather[0].icon) {
                    iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                }

                if (window.backgroundManager && typeof window.backgroundManager.setWeather === "function") {
                    window.backgroundManager.setWeather(data.weather[0].main, data);
                } else if (window.asciiRain && typeof window.asciiRain.setWeather === "function") {
                    window.asciiRain.setWeather(data.weather[0].main, data);
                }
            } catch (err) {
                console.error("Error searching weather:", err);
                alert("Failed to fetch weather for given city");
            }
        });
    }

    // 2. Dynamic Year in Footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 3. Slideshow Logic
    let slides = document.querySelectorAll('.slideshow .slide');
    let dots = document.querySelectorAll('.dot');
    let current = 0;

    function showSlide(index) {
        if (slides.length === 0) return;
        slides[current].classList.remove('active');
        if (dots[current]) dots[current].classList.remove('active');

        current = index;

        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
    }

    function showNextSlide() {
        if (slides.length === 0) return;
        let next = (current + 1) % slides.length;
        showSlide(next);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            let index = parseInt(dot.getAttribute('data-index'));
            showSlide(index);
        });
    });

    if (slides.length > 0) {
        showSlide(0);
        setInterval(showNextSlide, 3000);
    }

    // 4. Sticky Navbar Logic & Element Morphing
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.nav-item');

    // The total distance (in pixels) over which the morph transition completes
    const maxScroll = 400;
    // Dead zone at the very top (in pixels) before the transition begins
    const scrollOffset = 0;

    // 6. Terminal Text Setup (Fastfetch generation)
    function generateFastfetch() {
        const ua = navigator.userAgent;
        let browser = "Unknown";
        let browserVersion = "";

        if (ua.indexOf("Firefox") > -1) { browser = "Firefox"; browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || ""; }
        else if (ua.indexOf("OPR") > -1 || ua.indexOf("Opera") > -1) { browser = "Opera"; browserVersion = ua.match(/OPR\/(\d+)/)?.[1] || ""; }
        else if (ua.indexOf("Edg") > -1) { browser = "Microsoft Edge"; browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || ""; }
        else if (ua.indexOf("Chrome") > -1) { browser = "Google Chrome"; browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || ""; }
        else if (ua.indexOf("Safari") > -1) { browser = "Safari"; browserVersion = ua.match(/Version\/(\d+)/)?.[1] || ""; }

        let os = "Unknown OS";
        let de = "Unknown DE";
        let wm = "Unknown WM";
        if (ua.indexOf("Win") > -1) { os = "Windows"; de = "Aero"; wm = "DWM"; }
        else if (ua.indexOf("Mac") > -1) { os = "macOS"; de = "Aqua"; wm = "Quartz"; }
        else if (ua.indexOf("Linux") > -1) { os = "Linux"; de = "GNOME"; wm = "Mutter"; }
        else if (ua.indexOf("Android") > -1) { os = "Android"; de = "Material"; wm = "SurfaceFlinger"; }
        else if (ua.indexOf("like Mac") > -1) { os = "iOS"; de = "Cocoa Touch"; wm = "CoreAnimation"; }

        let gpu = "Unknown GPU";
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    // Simplify long GPU strings
                    gpu = gpu.replace(/ANGLE \(|\)|Direct3D.*|vs_.*|ps_.*/g, '').trim();
                }
            }
        } catch (e) { }

        const cores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency : "Unknown";
        const memory = navigator.deviceMemory ? navigator.deviceMemory + " GB" : "Unknown";
        const resolution = `${window.screen.width}x${window.screen.height}`;
        const lang = navigator.language || "en-US";

        const user = `guest@joel-portfolio`;
        const separator = "-".repeat(user.length);

        const logos = {
            "Google Chrome": [
                "                            ",
                "           ########           ",
                "       ################       ",
                "     ####################     ",
                "    ++####################    ",
                "   ===+#####+=---==++++++==   ",
                "  =====+##+.=++++=.:--------  ",
                "  ======+*:++++++++.--------  ",
                "  =======+:++++++++.--------  ",
                "  =========:=++++=::--------  ",
                "   ===========--==---------   ",
                "    =============---------    ",
                "     ===========:--------     ",
                "       ========--------       ",
                "          ====------          ",
                "                              "
            ],
            "Firefox": [
                "                          ",
                "                              ",
                "                ####          ",
                "               #######        ",
                "     +++ ++    ######## #     ",
                "   ++++++++++-+++++++++####   ",
                "   ++++++++++++--+++#++++##   ",
                "   ++++#######------#++++###  ",
                "  ++++++++----------++++++++  ",
                "   +++++++---------++++++++   ",
                "   +-++++++++----++++++++++   ",
                "     ---+++++++++++++++++     ",
                "       ------++++++--++       ",
                "           -------+           ",
                "                          "
            ],
            "Safari": [
                "        ##############        ",
                "     ######-.+..+.-+#####     ",
                "   ####-.-+++#++++++--+####   ",
                "  ###..++++-+++++++###. .###  ",
                " ### +++++++++++#### . #+.### ",
                " ## -++-++++++###-.  +##+- ###",
                "## -+------...    ..##+--++ ##",
                "## ++----+..###.  -##++-+++.##",
                "##.#-----. ######-#+------# ##",
                "##..-+.. .#####-.-------++  ##",
                " ## -+- ####.  ..-------+- ###",
                " +## ..##+.  .---------.  ### ",
                "  ###    ..........-+..  ###  ",
                "    ###    ..+..# . .  ###.   ",
                "      +####.   .  .+####      ",
                "         .+#########.     "
            ],
            "Microsoft Edge": [
                "        :::::::::::::::       ",
                "     :::::::::::::::::::::    ",
                "   :::::::::::::::::::::::::  ",
                "  :::::-----::::::::::::::::: ",
                " ::-++*******+=-::::::::::::::",
                ":-+**++++++++++*+-::::::::::::",
                "=***++++++++++  *+--::::::::::",
                "****+++++*%%      -----:::::::",
                "******++*%@@      ------------",
                "********%@%%%    ------------ ",
                "********%%%%%%    ---------   ",
                " *******%%%%%%%%%             ",
                "  ******#%%%%%%%%%%%%%%%%@@@  ",
                "   ******#%%%%%%%%%%%%%@@@@   ",
                "     *****#%%%%%%%%%%%@@@     ",
                "        *****##%%%%%%%        "
            ],
            "default": [
                "#################++###########",
                "############+-+--...-...-+####",
                "###########+.-.............+##",
                "###########-...++++++--....+##",
                "###########.-++++++++++++.-###",
                "##########+-+++++-+++++++.####",
                "##########++#+++--------+#####",
                "#########++++##++++#----+#####",
                "###########+++++++++-+++######",
                "######+...-++++-----++++######",
                "#++++---++++-+++++++++########",
                "+++-----+++++---+++++#########",
                "-----...--+++++--++###########",
                ".---+-...-+++++--.+++++-++-+--",
                ".---.--....-+++-..----++++++++",
                "..---.--.-...++-..-----+++++++"
            ]
        };

        const logo = logos[browser] || logos["default"];

        const info = [
            `<span style="color: var(--accent-cyan)">${user}</span>`,
            separator,
            `<b>OS:</b>         ${os}`,
            `<b>Host:</b>       ${browser} ${browserVersion}`,
            `<b>Resolution:</b> ${resolution}`,
            `<b>DE:</b>         ${de}`,
            `<b>WM:</b>         ${wm}`,
            `<b>CPU:</b>        Intel/AMD/ARM (${cores} cores)`,
            `<b>GPU:</b>        ${gpu.substring(0, 24)}`,
            `<b>Memory:</b>     ${memory}`,
            `<b>Language:</b>   ${lang}`
        ];

        let lines = [];
        const maxLines = Math.max(logo.length, info.length);
        for (let i = 0; i < maxLines; i++) {
            let left = (logo[i] || "").padEnd(34, " ");
            let right = info[i] || "";
            // Keep left colored green, let right be default or contain its own spans
            lines.push(`<span style="color: #27c93f; letter-spacing: 2.5px;">${left}</span>  ${right}`);
        }

        return "> fastfetch\n\n" + lines.join('\n') + "\n\n> ";
    }

    window.terminalFullText = generateFastfetch();

    window.addEventListener('scroll', () => {
        // Calculate active scroll after passing the offset
        let activeScroll = window.scrollY - scrollOffset;
        let progress = activeScroll / maxScroll;
        let lineProgress = activeScroll / (maxScroll * 2); // Expands at half the rate

        if (progress > 1) progress = 1;
        if (progress < 0) progress = 0;

        if (lineProgress > 1) lineProgress = 1;
        if (lineProgress < 0) lineProgress = 0;

        // Apply progress as a CSS custom property to the root document
        document.documentElement.style.setProperty('--scroll-progress', progress);
        document.documentElement.style.setProperty('--line-progress', lineProgress);

        if (progress > 0) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlighting based on section scroll position
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });

        // Terminal Typing Logic
        const terminalTrack = document.getElementById('terminal-track');
        const terminalBody = document.getElementById('terminal-body');
        if (terminalTrack && terminalBody && window.terminalFullText) {
            const trackRect = terminalTrack.getBoundingClientRect();
            let typingProgress = 0;

            // trackRect.top is 0 when the sticky wrapper hits the top
            if (trackRect.top <= 0) {
                const scrolled = -trackRect.top;
                const totalStuckDistance = trackRect.height - window.innerHeight;
                typingProgress = scrolled / totalStuckDistance;
            }

            if (typingProgress < 0) typingProgress = 0;
            if (typingProgress > 1) typingProgress = 1;

            const charsToShow = Math.floor(typingProgress * window.terminalFullText.length);
            const textToShow = window.terminalFullText.substring(0, charsToShow);

            const lines = textToShow.split('\n');
            let html = '';
            lines.forEach((line) => {
                html += `<div class="terminal-line">${line}</div>`;
            });
            html += '<span class="cursor" id="terminal-cursor"></span>';
            terminalBody.innerHTML = html;
        }

        // Android Balloon Logic (Mobile Only) - Removed relative movement as requested
        // The balloon will now just scroll natively with the page.
    });

    // 5. Scroll Animations with Intersection Observer for Text Placeholders
    const animationElements = document.querySelectorAll('.fade-in, .slide-up, .slide-left, .slide-right, .pop-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Fire when 15% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // When element comes into view, attach .visible to trigger CSS transitions
                entry.target.classList.add('visible');
                // Unobserve so it doesn't animate backwards when scrolling up
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animationElements.forEach(el => {
        observer.observe(el);
    });

    // 6. Delayed Mobile Navigation Logic
    const navLinksContainer = document.getElementById('nav-links');
    const aboutSection = document.getElementById('about');

    if (navLinksContainer && aboutSection) {
        window.addEventListener('scroll', () => {
            if (window.innerWidth <= 1024) {
                // If scrolled to or past the about section
                if (window.scrollY >= aboutSection.offsetTop - 150) {
                    navLinksContainer.classList.add('active');
                } else {
                    navLinksContainer.classList.remove('active');
                }
            } else {
                // Remove active state on desktop so default CSS handles it
                navLinksContainer.classList.remove('active');
            }
        });
    }

    // 7. About Me ASCII Wipe Animation
    const aboutAsciiContainer = document.getElementById('about-ascii-container');
    if (aboutAsciiContainer) {
        // You can drop your ASCII art frames here. Ensure they have similar widths/heights!
        const asciiFrames = [
            [
                "+****#####%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##################*********************+++++",
                "-----======================+++++==========++++==++++===+=============--:::::-----::::-------:-------",
                "=----========================================================--------::................:..::..::::::",
                "+=---=====================-===================--==============------:::....................:..::::::",
                "++======+=======++++++====-=+++++==++++++++++-  -======---::::....:::::::::::::.....................",
                "+++===++++++++++++++++++++-++++++==++++++++++=. .=--:::::::--------::::::---------::::::::::::::::::",
                "-+++=+++++++++++++++++++++-+++++++++++++++++++=.:----------------------------------:::::::::::::::--",
                "=+***+++++++++++++++***+++=+++++++++=--=+++++++::-----------------------------------::::::::::::::::",
                "++****++++++++************=******+==---+++++++++.----:------------------------------::::--::--------",
                "+++**+++******************+******+--+++****++***+.==---===---==========----------:::::::::::--------",
                "++*****************######*:******==+*==++:.  :=++-:====++=======++==--------------:::::::::::-=+*##%",
                "*****************#########.-##**=-.::.  ..     ..::...-+++*+===========-------------::::::-:-------=",
                "********##################+.##+:.   ....              :..:+******+++++++==========------------------",
                "***+*********##############-+#-      . ...   .      .        .==++++++============----------====----",
                "*****++-=++++===+====++**#*+.=.       .     ..                .=++++++=============-----------------",
                "*****+=:-==++=-:----:-=++++=.    . . .                        .=++++++====--------------::--:::--:-:",
                "#*#***+--==+++=--=----==+++-    .                     .       :==+++++==--------=-------:::::-------",
                "####**+::++..-+==+===-===++:              .      .--::. .   ..:======--------------::::::::::::::---",
                "####***-::.. :===+=:-======                   ..:=*++**=.     .:===-----:::::::::...................",
                "#%##***-:.....=====-.:::--+.           ......::=#%%###**+:      :-:... ....                .:-...   ",
                "#%###**=:.....--====-..:.-=:      ......::-=+*##%%%%%%##*-.             ...          ..  ...........",
                "#%#####=-::...:..====------.    ..:::::-+#####%%@@@@@%%%##-    ....::.....................  .  . .:.",
                "###%###+-::...  .-===--:::-:   ..:::-=+*########%%@@@@@%%%#=    :+++++++=++++++*+++++===::.   ......",
                "#%#%###*=-=:..  .:-===-:..::   ..:--=++++*****++=-::::=+*###: .--===-------------:::::::::-:::-=----",
                "*##%%###=-=-..   . .=+++*:.::  .:::......:-==-:......:-=*###+:---:::---::-:-:-:---------::--=-=-----",
                "*%##%#+===+=::. .. .+*+%#-..:. ::........:::.............:: -.++---------------=========--=*+*****++",
                "+#%#%#**+*#%+-.... ...*%#==..:.:--:...............    ::-+*-+-+:#%@@@%##***+++++#@*++++++##***#%##%@",
                "+#%#%%##@@@@@%:...   .*%%*=:.:. .::.::. .....+-.-:..::=#%@%-+#=*%@@@@@%%%%###***##**+++++=*#%@@@@@@@",
                "+#%##%%#@%@@@@-... ...*%#%%-:.:.:=-:::----=.-@@*-%@%%%@@@@#=##:+%############%%%%#*#%%=:::*%@@@@@@@@",
                "=####%##%#@@@@*..:....%@+@@%*=:::+##++**#*=:*@@@%+%%#%%%%*+#%#*@%##%%%%%%%%%##*++**##%+::-*#***@@@##",
                "=#%##%##%%@@@@*..:....@@@@@@@@-::=##%####+-+*###*#*==::=+=++*+*%%====+++++++=:===+++***#%%#+*@%@@@@@",
                "=#%#####%%@@%#+.... . %@@@@#@@==-=-+##+-===:.:=-..:==-:::=====-#%%%%%%%%%@@%#=*#**##%%%@#*##%@@@@@@@",
                "=#%###%%##@@##*..:- ..#@@@@%####=-=====---:.  ...:--=.  :===--*#############*=====*#%%##@@@%#@@@@@@@",
                "-#%%##%%#*+%*+#..-= :.*@@@@+#@@@#-:----.. ....::::......:==-:-%@@%%%%##***##%#*%@*-:.:::....=@@@@@@@",
                "-#%%##%%#*+===+..:: :.=%@%%%@@@@@#-:--:......:-=+**##*-:---:.-:...::::-***+=:-......::-::...=@@@@@@@",
                ":*%%#%%%#*===--.... ..-%@@%%%@@%#-:.:---:--===-::-=+++=:--:.-+:...      .:.  :.........::: .=@@@@@@@",
                ":*#%#%%@#+===-+-.-= +:-#%%%%##=      .:-::-===-..:-=++=--:::+%#*.........*:. ....    .. ::..-@@@@@@@",
                ":+#%#%%@%===+==-... -..*%#*.   .-**+-. ...:---:::--=++=-:..-*%@#%#+=---.  -:...::.....::--:.-@@@@@@@",
                ".+####%@%+++*.   .. ...*%*:  :-:-++. +:.   ........:::....-+*#@@%%#%@@@@@@@*:.#:-......--..:-@@@@@%@",
                ".=####%%%+-       . ...*#*:=**-=+*-=**-::.       .     .:-=+**@@#*-=#@@@@@@@@@@#-.......:...-%@@@@@@",
                "++#####%#.  .-==-..-=-.++#%%*-.-+-..-+:::-::.       ..---=+++%@@###--=%@@@@@@@@@@@@%*-:    .-%@@*:*@",
                "..*#***#= ...=+:...:+#%%%#=-=. .=+++**-.:--------------======%@@#=##=:=%@@@%%%%%@@@@%@@@@*..:--   .*",
                ".....  ...::.:=*%%%*=+*####+:  -**+**+-:..-----------------.#@@%#+=%@#:.:+%@@%%%@@%%%@@@@@#-:.-=..-:",
                "......   ..-*@@#*####******=. .=**+*+*--:..:---------::::..*%@@%#*-+%@#=:..-*%%%%@@%%%@@@@@##+-=-:..",
                ".  .::.-*-*%#+%%#*********+-  -***+**+=.::.  .:::-::......+#%%%###+-*@%%*=:.:-+*#%%%%%@@@@@@+..::...",
                "+@@@%#*=-=#@@#+%%#********+-  -+*****++-.:::.   .......:-+***#%####=-#@%#*+=-:-+*#%%%%%@%@@@@*. ..::",
                "%@@@@%+--+%@%%#+#%%***+++++-  :==+****++-..::.  .....:+*++*+*###*#*+-+%@##++=-:-=*###%%%#%@@@@+  ...",
                "@@@@@%%*=#%%%%%#**%###*++++:  :===+++==++-..:::....=+==++==+*##****=-=#@%%#+++=--+#######%@@@@@=.:. ",
                "@@@%%#%%%%%%%%%%#++*#%%#+++- .-+=====-=++=-.....  -*#*++=+++*##++**=-=*%%%%*+++=-=*######%@%%@@@*:  ",
                "@@@%#*+*#%%%%%%###++***%#*+- .-======-=+===-:....:+==--====++**++**=-=+*#%%#*++=--+****+*##%%%@@%.. ",
                "@%%##*=*##*+*#####*+*#*=*#*=..:======-===-==-::..:---=+==+==+**=+**+-=++=#@%**+=---==+=+*+#%%%@@@*. ",
                "%#+-:-*##%%##*+=*##*=+#*=+==. :---===-===-:-=:...::+++++==--+**==+*+--++==#@%*+==---=+=-=*###%%%@@: ",
                "#*+: .-**++#%###*++*+-****++: .:--===--==--:--...::=--=++=--=**===++--+*+-=*%%*+=--===:++++*%%#%%@@.",
                "%*===..-#%#*+######*+==***++=...::===--===--:-==:.:-::-===--=**+==++==+*+-:-*%#+=---=-:--=*%#*#%%@@-",
                "%*=::-.-#%%%%*+*##***+:=**+++-...-==--====-:::=-..-=++++==--=+++=+*+==+**=-:-*#*=----:-+**+*+*##%@@%"
            ],
            [
                "************+****++++++*+++++++++++++++++++++++++++++++=======..:----:::::::::::::::::::::..........",
                "*******************************+++++++++++++++++++++++++======..:-===:::::::::::::::::::::..........",
                "***********************************+++++++++++++++++++++======..:====:::::::::::::::::::::..........",
                "***********************************++++++++++++++++++++++=====..:====:::::::::::::::::::::::::......",
                "*************************************++++++++++++++++++++=====..:==++::::::::::::::::::::::::::.....",
                "******************************************+*+++++++++++++++===..:=+++-::::::::::::::::::::::::::....",
                "*********************************************+++++++++++++++==..:++++-:::::::::::::::::::::::::::...",
                "***********************************************++++++++++++++=:.:++++-:::::::::::::::::::::::::::...",
                "***********************=:...:-=+*****************+++++++++++-:.....:=-:-:::-::::::::::::::::::::::::",
                "*********************+:.........+*****************+++++++++:.........-------::::::::::::::::::::::::",
                "########*##**********:........=::********************++++++..=#%#**:.---------------::::::::::::::::",
                "####################+:.......:+************************++++---:--.--:---------------::::::::::::::::",
                "####################*-...:--=*+=************************++++-=++*+++=---------------::::::::::::::::",
                "#####################+:..-+*+***#************************++++----=--+-----------------:::::::::::::-",
                "#####################+--=------+****************************+=:---:-+------------------::::::::::::-",
                "####################*+=**+-:::=******************************-:...:=***++=--------------::::::::::--",
                "###################*===-=*+**#####***************************+---=**#%#####*+-------------------:--:",
                "##################+:--:---=*###########***********************-+*++########%%*---==-------------==.:",
                "#################+-::::-----=*############**********************=*####**++**##=----------------+-...",
                "#################=........:::-*##################******++*******#*####**+++**#*====----------=+-..  ",
                "################*-..........:::-+##################**#*+++****#*#*****++==+*##*===-----------:.:..  ",
                "################*:......:...:::-*##################**+*+=++********+==----+****====--------:...     ",
                "################+:.........:::-=++***#####****+++=-==+===--=+******++=-::=****+=======-----...  .   ",
                "##%#############=.............----=++**+====-=+*##*++++++-:-=+***++*+=---===+**======------:..      ",
                "##%%############=.............-##+=-:--====+#@@@@@@@@@@@@@@+++*****+++==:-+++**======-------.       ",
                "%#%###%#########+.............-######*#*+=--*@@%@@@@@@@@@@@#=-=*****+++#%##*=-=======--------.     :",
                "%%%%%%%%%#######=.............-+*++++=--==:--+#+*@@@@@@@@@@@*+++*+=******+=--========---------------",
                "%%%%%%%%%#%%%##+:::::.........-===-:::+#######*+#@@@@@@@@@@%**%%*::::::.:---=:..:::::::::::-------::",
                "#%############*-...............:=**####################***+--=+-:.::--...:-++=......................",
                "%%%%##########+...............+#########################**+-::----:==-::-=++*=. ...       . ...:::::",
                "##%%%#####%##*-...............*##########################*=:::----=--:::-=+**+. ...      .. ....::::",
                "#############+....:...........*##########################*-.::::--==------=+*+:  ..      .....::::::",
                "%%%%%########=...:...........:###########################=:.:-=====-::-=+++++*=.  ..     .....::::::",
                "%%%%%########=.::.:::........-##########################*:.::--=+=--.:=******#+.  .      .....::::::",
                "#############=:+*++=:::......=##########################+...:-====---.=*####*: .  .      ... .::::::",
                "%%%%%%%%%%%%%#*#%%@@@%#*+===+##################%##%#####=............        ....        ... ..:::..",
                "*####*********#%#%@@@@@%#*+******++++++++++++++++++======.........             ..   .    ... .......",
                ".............:*%#%@@@@@@%++*#:................................... .     ..     ..         .  ......:",
                "***************#%@@@@@%#*+**#*********####################:......   +          ..        ... .......",
                "**#**+#%%%%%%%%%%######*++****###%%%%%%%###*#*#*+=++++==#%:......  .#:         ..        ... .......",
                "*#++**%%%%%%%%#####*##+++**##*##%%%%%%%%###%#######%%###%%=.....   +#=         .         ... ...... ",
                "@@%%%%%%%%%%%#*#%##%%+=+**#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*....    ##=-   .              .....::::. ",
                "%%%%%%%%%%%%%#%%##%@#==+*###%%%%%%%#####################*=-..::::::--:---=----:::::::::.::::*%%%%%. ",
                "------------+#**#@@%+-=+:.......::-=+*******************=-:::--==---:-==+++++==-------------*####*  ",
                "..........:=###%@@%*===++=====---::...........::-=+++*++=-::::::::.....:::::::..............--=+*+  ",
                "+++++++++++#%#%%%%#+===++================----::...............::----::-=======-:::::::::::::-----:  ",
                "++++++*****%######*===**+=============================--:::...         ...:::------:::::::::......  ",
                "+++++++++*####%#***===+*+========================================---:::...           .             .",
                "=--------=#####*=--=++**+================================-==================---::..     .           ",
                "==+++++**##########****#+============+==+===========================----========-:..                ",
                "#+##############%%%##**#+=====================================================-=-:..                ",
                "*+***#####*#####%%%#*###+=======================================================-:..   ..           ",
                "*+***######**#####%#*#%%+=====+====================================-===--=======-:...               ",
                "*+****#**#*++***###*==*%+===============+===================================-===-:..      .         ",
                "*+**********########+===========================================================-:..                "
            ],
            [
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%.      .@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*    ..:--@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*   ...:-*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#  .....:*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*...--::%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "@@+:.  .:+%@@@@@@@@@@@@@@@@@@@@@@@@@@@@+. ....#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "         ..-@@@@@@@@@@@@@@@@@@@@@@@@@@@*:.   :%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "       .:==+@@@@@@@@@@@@@@@@@@@@@@@@@@%-:--==#@@@@%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "       .-++*%@@@@@@@@@@@@@@@@@@@@@@@#+=+====.=%@@@*#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "    . =**+-:-%@@@@@@@@@@@@@@@@@@@#*+++++===-+#%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+:==#@@@@@@@@@@@@@@@@@",
                "  .  .*#*=-=*@@@@@@@@@@@@@@@@@@++*******++++***%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*.:--=%@@@@@@@@@@@@@@@@",
                "  :.:-=+*****%@@@@@@@@@@@@@@@@++++***##+=++++++#######%@@@@@@@@@@@@@@@@@@@@@@= --=-%@@@@@@@@@@@@@@@@",
                "  .:+-=++++=-%@@@@@@@@@@@@@@@#+===++**#*+=+++***+=+++*#@@@@@@@@@@@@@@@@@@@@@@+  :::+@@@@@@@@@@@@@@@@",
                "...-:::----:=@@@@%-. .-@@@@@@++==-:-++**+=++*##*==--:=*@@@@@@@@@@@@@@@@@@@@@@@%*###@@@@@@@@@@@@@@@@@",
                "+%%*=:. .--=@@@@=       -@@@@+==-:-===+*+=++*++==:....=@@@@@@@@@@@@@@@@@@@@***#%%*+=-=*@@@@@@@@@@@@@",
                "  :#@*-+@@@@@@@*         +@@*+=-::-=++++=---::----::.:-#@%@@@@@@@@@%=-::.   :.:##:     :#@@@@@@@@@@#",
                " .:-=%%@@@@@@@@%         +@@+==--*+===-:.:.:------=.   .==%@@@@@@@+      .  .-*%#... .=#%@@@@@@@@@@#",
                "%@@@@@@@@@@@@@@@:    ... *@@:  .=%=--:.::::-===+#+.     . .  .#@@-           .:*@%-:-=#%@@@@@@@@@@@%",
                "@@@@@@@@@%@@@@@@=        @@*-.............-+*#*%=    .         ..             .:=%%+--=*@@@@@@@@@@@%",
                "@@@@@@@@@#*+++#@-       =@***=..    ....:-+**##*      .  .       .  .   .     %@@%@@@@@@@@@@=.....:=",
                "@@@@@@@@@%==*=*+   .    -@******++++====++++***-         .    :+*.      .  . #@@@@@@@@@@@@#++:.     ",
                "@@@@@@@@@%: :::           . .:=++**+=-:::.:::..             --:.:.         :-@@@%*#@@@@@@@*..     . ",
                "@@@@@@@@@%-...               *@#%%= .         .     .      .--=+==-.     ..:+*@@@%##%@@%@*:.    . . ",
                "%@@@@@@@@@-  .        .     .%%%@@*                    ..:-.:-=++=+*#+-::. .. =*%%%**@%+::#@-      :",
                "%@@@@@@@@@= .+*     .   ..  .#%%@@+                     ...::::-:-*%%#*+=.    .-#%##=....+@@=   :-+@",
                "-%@@@@@%=.-=@@@#             =*%%%-                    .........:+#%%%**#+=..-:=%##**-..-+###%%++@@@",
                " =@@@#..:-=%@@@@*           .:*#%%*                 .*::::..  .=*##%##--.--. .. =#*****==*####@@@@@@",
                " . #-+++=+*%@@@@@=.=****++=  .=##%@*                %%@@+:.  :*#####%#*-#+.  ..:.**+++=+###+=-=*%@@@",
                "    -=+===+*%@@@@@%=+**===.:  +*###= .          :+@@%%%@@@*.:*******##+:#=   ...:.-.    ..:#*-..%@@@",
                "    =-==----=+*#%%%#=-**+-:    =+*++.    .      :@@@@%@%#@@%+-+****+**=--   .: .. ...   .  ..  *@@@@",
                "  :@@=---::....:---::.:..       :==:          =#@@%@@@@@%*==-+#**++++=-=.   =#.           .: .+@@@@@",
                "   =@%-............                       .+:#@@%@%@@@@@@%*-:=#*+++++*+=   .*=:.    .::-==-..#@@@@+:",
                "     *@*==--=+*+.              .         .*-.%@@#%@@@@@%##%#++#=::.::==.   -*#=--:::::.... -%@@@@@@*",
                "      :%@@@@@@@-     .             .       .-%%#@@@@@@%+*+%@@@@+.....:=   .  .:=---++-     -@@@@@@@@",
                "   .    -@@@@@:                    -*.     ..##@@@@@@@%++=%@%*%*:.   .-.               . .:@@@*:.=%%",
                "         .+@%:                       . -*+-..:=#@@@@@@@*:.--=*#+.     ..  .   ... .+@@-+@@@@@@:.....",
                "    .#.   .                 .        =@%*+**+++-*@@@@@%+...:+##%*.     -. .......#@@@@@@@@@@@@@@@@@@",
                "      :                   .         :##########*=%@@@%%+..+#%*%@*- .     .=  -- :%@@%@@@@@@@@@@@@@@@",
                " .                          .       .=*#%%%%####*-@@%@%+.:++#@@@+:    .      -.     .  #@@@@@@@%@@@@",
                ".                                     =%%%%%###***:@@@@+.....:-=*#=...            .   +@@@@@=   .  .",
                "                          .        .  .+%%%%###****.   ...:=*###%%#*=:.......        +@@@@@@@*++===+",
                "    .                                  .+%%####***++......-*#%%%%*+-.........:....  =@@@@@@@@@@@@@@@",
                "    . .              .       .       .  :*####****+++....:-=+=--=**+==.        ....*@@@@@@@@@@@@@@@@",
                " .                          .    .     . -*##*****+++=:::::::::::-----===       ..+@@@@@@@@@@@@@@@@@",
                "          .  .                  .    .    =******+++++=...............:--::      :@@@@@@@@@@@@@@@@@@",
                ".         .    :-.                        .+****++++===:            . .-+-..    .@@@@@@@@@@@@@@@@@@@",
                "              .#@%..                       .+*++++=====-.            .. .=:..   @@@@@@@@@@@@@@:-=.  ",
                "   .          .++:    .                     -**+===-----:.==:.    .:-.   .-::::@@@@@@@@@@@@@@@%.   .",
                "     .          .                            +*+=---:::::..               .  .@@@@@@@@@@@@@@@@@@%%%%",
                "                  ..      ..                 .++=-:::.....           .       @@@@@@@@@@@@@@@@@@@@@@@",
                "        .    ..=-:   .           =:           :+=:........         .  :  .  @@@@@@@@@@@@@@@@@@@@@@@@",
                "    .   .     :#%%%#.           *#*+:          ==:.......            .     %@@@@@@@@@@@@@@@@@@@@@@@@"
            ],
            [
                "---::::::::::::::................::*%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%@@@",
                "------:::::::::::::.............:::*%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "-----::::::::::::::::................---:.:-+*#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "-----::::::::::::::::..:::::....     .     .   ..*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "-----:::::::::::::::::::::::.                   .. .%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "--:::::::::::::::::::::::::.       .             ....:@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "---------:::::::::::::::::.                      ..  ..=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "---------::::::::::::::::.                  .     . .....:#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "-----:::::::::::::::::::.         .            . .. .......-%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "--------:::::-::::::::::                      .  ..  ...   :+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "--------:::::::::::::::: .                 .              ...*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "--------:::---:::::::::.             . .       .           . .*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "------------------:::::.                                     .:@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "------------------:::::         .---.   .         .  ..        #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "-----------------:::::.  .   .:-===:=         ...:-==+==-     :@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "-------------------:--.      :-++:..==:   .:=++++*+****#+::-=*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "---------::----------:     .:-=+*= ++=:..::-=++**#####%%##%%#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "----------::---------:....:----#*+:==-::-=+++-=++**+*#%#-...=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "----------------=::-----=====-:+##=-:..:-++**+=+=:--: :+=::+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "--------------=%%#:-=========---==-:....-=+**##=:-#:=:*%###%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "-------------*%@@@@*-=========--:::.....:=++*#%#*@#*.*+%@%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "---------=#%%#@@@@@@%=======---:.........:=++*#%#+ %@.:*%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "-------+%@@@@@%@@@@@@@*===---::...  ....:-=+++*=:#@@@+##*#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "----=%@@@@@@@@@@@@@@@@@%=----:.       ..:-=+++*=:=:+#*@@*#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "--*@@@@@@@@@@@@@@%@@@@@@@+---:.       ..--==-::::=+++#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                "#@@@@@@@@@@@@@@@@@%@@@@@@@#=-:.        ..:-====--:. .*%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@=-+@%*.  .  :--:::::.   .+*#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%%%",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+#@@%*.     . .:.:.....:=+*#%@@@%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%%%",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%@@@@#*=..... ........:++****#@%#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%##%",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%*#%%**+...:-=-----++++:::--=+%%#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%##%",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@*-.-=*@@###*=..:-=+=--*#**=+++--=---=#@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%###",
                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@%+==#%%####*+:.:+*+=##*###@@%-.....-=+#@@@@@@@@@@@@@@@@@@@@@@@@@@%%%####",
                "@@@@@@@@@@@@@@#@@@@@@@@@@@@@@@@**%########=..=#@%%%%@@@@#.. ...-:.#@@@@@@@@@@@@@@@@@@@@@@@@@@@%%####",
                "@@@@@@@@@@@@@@#*@@@@@@@@@@@@@@@@-=-%%#%%%##*--%@%%@@@@@@*-*=:-=+#%%%@@@@@@@@@@@@@@@@@@@@@@@@@@%%####",
                "@@@@@@@@@@@@@@@=@@@@@@@@@@@@@@@@#.:%%#%@@%##+++=*%@@@@@@+-**-:-+*%@@@@@@@%@@@@@@@@@@@@@@@@@@@@%%%###",
                "@@@@@@@@@@@@@@@=#@@@@@@@@@@@@@@@@+.=##%@@@#%#**::+@@@@@%=-*%+::-+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%###",
                "@@@@@@@@@@@@@@@%=@%@@@@@@@@@@@@@@@..*#%@@@%####*=.*@@@@*::#@#-:-=*#%@@@@@@@@@@@@@@@@@@@@@@@@@@%%%###",
                "@@@@@@@@@@@@@@@@-@#@@@@@@@@@@@@@@@:..=*%@%%####**+:*@@%*-+%@*:.:-=*#%@@@@@@@@@@@@@@@@@@@@@@@@@%%%###",
                "@@@@@@@@@@@@@@@@=@#*@@@@@@@%@@@@@@@-::+#@%#####**+==%%#*-=*#=:.::-+*#%@@@@@@@@@@@@@@@@@@@@@@@%%%%###",
                "@@@@@@@@@@@@@@@@@@%*%@@@@@@@@@@@@@@%+:+==+#*###**+++**++-+#@%#-.:-=+##%@@@@@@@@@@@@@@@@@@@@@@%%%####",
                "@@@@@@@@@@@@@@@@@@%+%@@@@@@@@@@@@@@@@@*-=*#*###**=*+***++*#%#+-..:-=*#%%@@@@@@@@@@@@@@@@@@@@@%%#####",
                "@@@@@@@@@@@@@@@@@@#*%@%@@@@@@@@@@@@@@@#=.+#****++=+++++==+*#*-:...:-=+#%%@%@@@@@@@@@@@@@@@@@%%######",
                "%@@@@@@@@@@@@@@@@@*#@%@@@@@@@@@@@@@@@%#-.-#****++=+=++===--==:::....:=+#%%@%%%%*@@@@@@@@@@@%%##****#",
                "@@@@@@@@@@@@@@@@@@%%%%%%@@@@@@@@@@@@@##%%%#****++===-====---:..:.....:-+#%@@%#%#@@@@@@@@@@@%##******",
                "@@@@@@@@@@@@@@@@@@%*#%%%%%@@@@@@@@@@@##%%%%***+++===---=----:..:.  ....:=*%@@%#%@@@@@@@@@@%##*****++",
                "%@@@@@@@@@@@@@@@@@@+*%@@%%%%%@@@@@@@@%#%%%##*+++++==-------::..:-=  ....:=*#%%@@@@@@@@@@%%##****++=-",
                "%%%@@@@@@@@@@@@@@@@#*%@@@@@@@@@@@@@@@@##%#**++==+++=--:----:...:-%*    ..-++*%@@@@@@@@@%%##****++-=+",
                "%%%%%%@@@@@@@@@@@@@%%%@@@@@@@@@@@@@@@@*##%#*#*+-------:-+#@@@=.:=%@%.   .-+++%@@@@@@@@@@@@@@@@@@*==+",
                "%%%%@@@%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@..=#*++*+=-----=*%@@#+*%@#+***+. ..:=+%@@@@@@@@@@@@@@@@@@*==+*",
                "%%%%%%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@==-+++++++=----=+*#@%%#%@@@-:   -.  .::::.:==--:::*@@@@@=.....",
                "##%%%%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=..--=+++==----===+****%@@@@@%%@@@#. ..::-=+*##%%%@@@%%+......",
                "%%%#%%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#...::-=+==-::--====*##%@@@#%%%%@@@@@@@@@%@@@@@@@@@@%%%#+.....",
                "##%%%%%%%@@@@@@@@#+*#%@@@@@@@@@@@@@@%@%............. .=+**####%%%##*##+-=#@@%%@@@@@@@@@@@@@@%%%*-...",
                "##%%%%%%%@@@@@@@@@%**#@@@@@@@@@@@@@@@@%  ..........-+**####%%%%@@%#%%%@@@@@@@%%@@@@@@@@@@@@@@%%%%*:.",
                "%%%%%@%%%@@@@@@@@@@@%@@@@@@@@@@@@@@@@%@--===++++*#%%%#####%%%%%@@@%%%***#%@@@@@@@@@@@@@@@@@@@@@%%%%+"
            ]
        ];

        let currentFrameIdx = 0;
        let isWiping = false;

        aboutAsciiContainer.innerText = asciiFrames[0].join('\n');

        function triggerWipe() {
            if (isWiping) return;
            isWiping = true;

            const currentFrame = asciiFrames[currentFrameIdx];
            const nextFrameIdx = (currentFrameIdx + 1) % asciiFrames.length;
            const nextFrame = asciiFrames[nextFrameIdx];

            let currentLine = 0;
            const maxLines = Math.max(currentFrame.length, nextFrame.length);

            const wipeInterval = setInterval(() => {
                let displayLines = [];
                for (let i = 0; i < maxLines; i++) {
                    if (i <= currentLine) {
                        displayLines.push(nextFrame[i] || "");
                    } else {
                        displayLines.push(currentFrame[i] || "");
                    }
                }
                aboutAsciiContainer.innerText = displayLines.join('\n');

                currentLine++;

                if (currentLine >= maxLines) {
                    clearInterval(wipeInterval);
                    currentFrameIdx = nextFrameIdx;
                    isWiping = false;
                }
            }, 50); // Speed of the wipe (50ms per line)
        }

        // Trigger wipe every 3 seconds
        setInterval(triggerWipe, 4000);
    }

    // Interactive Android Balloon Pop & Drop Animation (No clipping)
    const androidBalloonSvg = document.getElementById("android-balloon-svg");
    if (androidBalloonSvg) {
        let isPopping = false;
        let popCount = 0;
        const balloonColors = ["#ff5f56", "#ffbd2e", "#27c93f", "#00d2ff", "#a29bfe", "#ff6b81", "#fd79a8", "#00cec9", "#ff9ff3", "#54a0ff"];
        let currentColorIdx = 0;

        androidBalloonSvg.addEventListener("click", () => {
            if (isPopping) return;
            isPopping = true;
            popCount++;

            // Easter egg: Invert website colors every 5 pops
            if (popCount % 5 === 0) {
                document.documentElement.classList.toggle("inverted-theme");
            }

            androidBalloonSvg.setAttribute("title", `Pops: ${popCount} (Every 5 pops inverts colors!)`);

            const balloonGroup = document.getElementById("balloon-group");
            const balloonCircle = document.getElementById("balloon-circle");
            const balloonTriangle = document.getElementById("balloon-triangle");
            const popLines = document.getElementById("balloon-pop-lines");
            const fallingGroup = document.getElementById("android-falling-group");

            // Step 1: Pop the balloon with burst lines
            if (popLines) {
                popLines.setAttribute("opacity", "1");
                setTimeout(() => {
                    popLines.setAttribute("opacity", "0");
                }, 200);
            }
            if (balloonGroup) {
                balloonGroup.style.transform = "scale(1.5)";
                balloonGroup.style.opacity = "0";
            }

            // Step 2: Android drops down off-screen (no clipping!)
            if (fallingGroup) {
                fallingGroup.style.transition = "transform 0.9s cubic-bezier(0.55, 0.055, 0.675, 0.19)";
                fallingGroup.style.transform = "translateY(140vh) rotate(35deg)";
            }

            // Step 3: Prepare new balloon off-screen and float back up!
            setTimeout(() => {
                currentColorIdx = (currentColorIdx + 1) % balloonColors.length;
                const newColor = balloonColors[currentColorIdx];
                if (balloonCircle) balloonCircle.setAttribute("fill", newColor);
                if (balloonTriangle) balloonTriangle.setAttribute("fill", newColor);

                androidBalloonSvg.style.transition = "none";
                androidBalloonSvg.style.transform = "translateY(140vh)";

                if (balloonGroup) {
                    balloonGroup.style.transition = "none";
                    balloonGroup.style.transform = "scale(1)";
                    balloonGroup.style.opacity = "1";
                }
                if (fallingGroup) {
                    fallingGroup.style.transition = "none";
                    fallingGroup.style.transform = "translateY(0) rotate(0deg)";
                }

                setTimeout(() => {
                    if (balloonGroup) {
                        balloonGroup.style.transition = "transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.25s ease";
                    }
                    if (fallingGroup) {
                        fallingGroup.style.transition = "transform 0.9s cubic-bezier(0.55, 0.055, 0.675, 0.19)";
                    }
                    androidBalloonSvg.style.transition = "transform 1.3s cubic-bezier(0.16, 1, 0.3, 1)";
                    androidBalloonSvg.style.transform = "translateY(0)";

                    setTimeout(() => {
                        isPopping = false;
                    }, 1300);
                }, 50);

            }, 1050);
        });
    }

    // 8. ASCII Matrix Pixel Scramble & Password Crack Decryption Hover Effect
    const scrambleChars = "░▒▓█<>/[]{}+=-_~#*&%$@01!";

    function getActiveGlyphPool() {
        if (window.nameTranslationsList && window.currentSiteLang) {
            const currentObj = window.nameTranslationsList.find(l => l.id === window.currentSiteLang);
            if (currentObj && currentObj.chars) return currentObj.chars;
        }
        return scrambleChars;
    }

    function attachAsciiScrambleEffect(elements, targetSelector = null) {
        elements.forEach(container => {
            const itemEl = targetSelector ? container.querySelector(targetSelector) : container;
            if (!itemEl) return;

            const initialText = itemEl.textContent.trim();
            itemEl.setAttribute('data-original-text', initialText);

            let animationFrame = null;
            let isHovered = false;

            container.addEventListener('mouseenter', () => {
                isHovered = true;
                if (animationFrame) cancelAnimationFrame(animationFrame);

                // Dynamically fetch active text (supports any selected language)
                const currentText = itemEl.getAttribute('data-original-text') || itemEl.textContent.trim();
                const glyphPool = getActiveGlyphPool();

                const scrambleDuration = 180;
                const crackDuration = 600;
                const totalDuration = scrambleDuration + crackDuration;
                const startTime = performance.now();
                const textLength = currentText.length;

                function runDecryption(now) {
                    if (!isHovered) return;

                    const elapsed = now - startTime;

                    if (elapsed < scrambleDuration) {
                        let output = "";
                        for (let i = 0; i < textLength; i++) {
                            if (currentText[i] === " " || currentText[i] === "\n") {
                                output += currentText[i];
                            } else {
                                output += glyphPool[Math.floor(Math.random() * glyphPool.length)];
                            }
                        }
                        itemEl.textContent = output;
                    } else {
                        const crackProgress = Math.min(1, (elapsed - scrambleDuration) / crackDuration);
                        const revealedChars = Math.floor(crackProgress * textLength);

                        let output = "";
                        for (let i = 0; i < textLength; i++) {
                            const originalChar = currentText[i];
                            if (originalChar === " " || originalChar === "\n") {
                                output += originalChar;
                            } else if (i < revealedChars) {
                                output += originalChar;
                            } else {
                                output += glyphPool[Math.floor(Math.random() * glyphPool.length)];
                            }
                        }
                        itemEl.textContent = output;

                        if (crackProgress >= 1) {
                            itemEl.textContent = currentText;
                            return;
                        }
                    }

                    if (elapsed < totalDuration && isHovered) {
                        animationFrame = requestAnimationFrame(runDecryption);
                    } else {
                        itemEl.textContent = currentText;
                    }
                }

                animationFrame = requestAnimationFrame(runDecryption);
            });

            container.addEventListener('mouseleave', () => {
                isHovered = false;
                if (animationFrame) cancelAnimationFrame(animationFrame);
                const currentText = itemEl.getAttribute('data-original-text') || initialText;
                itemEl.textContent = currentText;
            });
        });
    }

    // Attach to Education & Skills cards
    attachAsciiScrambleEffect(document.querySelectorAll('.skills-section .square'), '.square-item');

    // Code gibberish pool for idle cryptic representations (Projects & Hero Social links)
    const codeGibberishPool = [
        "0x4C696E", "0x6B6564", "0x456D61", "0x696C",
        "0x7F_ptr", "void*()", "fn_init", "sys::01",
        "0xAA_ff", "<T>&buf", "0x1337", "#!/sh",
        "0xDEAD", "0xBEEF", "asm_nop", "0x00FF"
    ];

    function getRandomGibberish(length, referenceText = "") {
        if (referenceText) {
            // Build gibberish respecting words and spaces of original text so card height remains identical
            const words = referenceText.split(/(\s+)/);
            return words.map(w => {
                if (/^\s+$/.test(w)) return w;
                let token = "";
                while (token.length < w.length) {
                    token += codeGibberishPool[Math.floor(Math.random() * codeGibberishPool.length)];
                }
                return token.substring(0, w.length);
            }).join("");
        }

        let res = "";
        while (res.length < length) {
            res += codeGibberishPool[Math.floor(Math.random() * codeGibberishPool.length)] + " ";
        }
        return res.substring(0, length);
    }

    // Attach Cryptic Code-Gibberish Idle & Scramble-Decrypt to My Projects cards
    const projectCards = document.querySelectorAll('.projects-section .project-items');
    projectCards.forEach(card => {
        const descEl = card.querySelector('.project-contents');
        if (!descEl) return;

        const initialClearText = descEl.textContent.trim();
        descEl.setAttribute('data-target-text', initialClearText);

        let idleGibberish = getRandomGibberish(initialClearText.length, initialClearText);
        descEl.textContent = idleGibberish;

        let animFrame = null;
        let isCardHovered = false;

        card.addEventListener('mouseenter', () => {
            isCardHovered = true;
            if (animFrame) cancelAnimationFrame(animFrame);

            // Always fetch dynamically updated translation text for the card
            const clearText = descEl.getAttribute('data-target-text') || descEl.textContent.trim();
            const glyphPool = getActiveGlyphPool();

            const scrambleDuration = 180;
            const crackDuration = 600;
            const totalDuration = scrambleDuration + crackDuration;
            const startTime = performance.now();
            const textLength = clearText.length;

            function runDecryption(now) {
                if (!isCardHovered) return;

                const elapsed = now - startTime;

                if (elapsed < scrambleDuration) {
                    let output = "";
                    for (let i = 0; i < textLength; i++) {
                        if (clearText[i] === " " || clearText[i] === "\n") {
                            output += clearText[i];
                        } else {
                            output += glyphPool[Math.floor(Math.random() * glyphPool.length)];
                        }
                    }
                    descEl.textContent = output;
                } else {
                    const crackProgress = Math.min(1, (elapsed - scrambleDuration) / crackDuration);
                    const revealedChars = Math.floor(crackProgress * textLength);

                    let output = "";
                    for (let i = 0; i < textLength; i++) {
                        const origChar = clearText[i];
                        if (origChar === " " || origChar === "\n") {
                            output += origChar;
                        } else if (i < revealedChars) {
                            output += origChar;
                        } else {
                            output += glyphPool[Math.floor(Math.random() * glyphPool.length)];
                        }
                    }
                    descEl.textContent = output;

                    if (crackProgress >= 1) {
                        descEl.textContent = clearText;
                        return;
                    }
                }

                if (elapsed < totalDuration && isCardHovered) {
                    animFrame = requestAnimationFrame(runDecryption);
                } else {
                    descEl.textContent = clearText;
                }
            }

            animFrame = requestAnimationFrame(runDecryption);
        });

        card.addEventListener('mouseleave', () => {
            isCardHovered = false;
            if (animFrame) cancelAnimationFrame(animFrame);
            // Cycle fresh cryptic gibberish on leave matching word spaces of current language translation
            const currentClearText = descEl.getAttribute('data-target-text') || initialClearText;
            idleGibberish = getRandomGibberish(currentClearText.length, currentClearText);
            descEl.textContent = idleGibberish;
        });
    });

    // Attach to Contact items
    attachAsciiScrambleEffect(document.querySelectorAll('.contact-text p'));

    // 9. Multilingual Translation on Name Hover & Site-Wide Language Glitch on Click
    const heroNameEl = document.getElementById('hero-name');
    if (heroNameEl) {
        heroNameEl.style.cursor = 'pointer';

        const nameTranslations = [
            { id: "en", name: "English", first: "Joel", middle: "Philip", last: "Binoy", chars: "01ABCDEF░▒▓█<>/[]{}+=-_~#*&%$@" },
            { id: "ar", name: "Arabic", first: "جويل", middle: "فيليب", last: "بينوي", chars: "ابتثجحخدذرزسشصضطظعغفقكلمنهوي░▒▓█" },          // Arabic
            { id: "ta", name: "Tamil", first: "ஜோயல்", middle: "பிலிப்", last: "பினோய்", chars: "அஆஇஈஉஊஎஏஐஒஓகஙசஞடணதநபமயரலவழளறன░▒▓█" },       // Tamil
            { id: "ml", name: "Malayalam", first: "ജോയൽ", middle: "ഫിലിപ്പ്", last: "ബിനോയ്", chars: "അആഇഈഉഊഋഎഏഐഒഓകഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹളഴറ░▒▓█" },       // Malayalam
            { id: "ru", name: "Russian", first: "Джоэл", middle: "Филип", last: "Биной", chars: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ░▒▓█" },         // Russian
            { id: "hi", name: "Hindi", first: "जोएल", middle: "फिलिप", last: "बिनॉय", chars: "अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह░▒▓█" }            // Hindi
        ];
        window.nameTranslationsList = nameTranslations;
        window.currentSiteLang = "en";

        // Multi-language dictionary for key page sections
        const siteTranslations = {
            en: {
                navHome: "Home", navAbout: "About", navSkills: "Skills", navProjects: "Projects", navContact: "Contact",
                aboutTitle: "About Me",
                aboutP1: "I am a young aspiring student pursuing a B.Tech Degree in AI and Data Science at Rajagiri School Of Engineering and Technology.",
                aboutP2: "While my main focus is on AI models, I have also ventured into Robotics, Mobile App Development, and IoT.",
                aboutP3: "I am from Kollam, Kerala, India, but I was born and brought up in Kuwait. I enjoy exploring new technologies and solving complex problems.",
                timelineSkillsTitle: "Timeline & Skills",
                experienceTitle: "Experience & Education Timeline",
                exp1Date: "2026 — Present", exp1Desc: "Software Engineer Intern @ ThoughtMinds (Building intelligent & scalable software solutions)",
                exp2Date: "2023 — Present", exp2Desc: "B.Tech in AI & Data Science @ Rajagiri School of Engineering & Technology (RSET)",
                exp3Date: "2021 — 2023", exp3Desc: "Higher Secondary Education @ Indian Community School Kuwait (Passed May 2023 - 95%)",
                exp4Date: "2019 — 2021", exp4Desc: "Secondary Schooling @ Indian Community School Kuwait (Passed Aug 2021 - 94%)",
                techSkillsTitle: "Technical Skills",
                skill1Title: "Python", skill1Desc: "Proficient knowledge, focusing on AI training and deployment.",
                skill2Title: "IoT", skill2Desc: "Experience with ESP32, ESP8266, and Arduino IDE.",
                skill3Title: "Android", skill3Desc: "Basic knowledge in Android app development using Android Studio.",
                skill4Title: "Object Recognition", skill4Desc: "Experience using YOLO models and hyperparameter tuning.",
                skill5Title: "Java", skill5Desc: "Object Oriented Programming foundation.",
                skill6Title: "Robotics", skill6Desc: "Experience with robotic arms kinematics.",
                projectsTitle: "My Projects",
                p1Title: "Banshee", p1Desc: "An overglorified alarm clock system with physical switches and sirens using ESP32.",
                p2Title: "Hangman Problem", p2Desc: "Solves every hangman game using DFS search to find a solution autonomously.",
                p3Title: "Readie-speakie", p3Desc: "A chatbot project that provides summaries based on document inputs.",
                p4Title: "SCARA-Kinematics", p4Desc: "Python program to perform forward and inverse kinematics on a 2DOF SCARA arm.",
                p5Title: "Person Detection", p5Desc: "A surveillance system using YOLO v8 to detect people and send email alerts.",
                p6Title: "Jumpy", p6Desc: "A LAN-Based KVM switch for seamless access between windows and linux systems.",
                p7Title: "QWOP RL Agent", p7Desc: "An experimental system with Reinforcement Learning in an environment of the flash game QWOP.",
                p8Title: "Acoustic Neural Input System", p8Desc: "An interface which helps people to navigate the cursor using EOG signals.",
                p9Title: "QRCOD", p9Desc: "A dumb communication system where it uses cameras and QR codes between computers.",
                contactTitle: "Get In Touch",
                lblContactName: "Name:", lblEmail: "Email:", lblPhone: "Phone:", lblAddress: "Address:",
                contactAddressVal: "RSET Kochi, Kerala",
                footerCopy: "Joel Philip Binoy | RSET Kochi",
                weatherFeelsLike: "Feels like", weatherHumidity: "Humidity", weatherWind: "Wind"
            },
            ar: {
                navHome: "الرئيسية", navAbout: "عني", navSkills: "المهارات", navProjects: "المشاريع", navContact: "اتصل بي",
                aboutTitle: "نبذة عني",
                aboutP1: "أنا طالب طموح يسعى للحصول على درجة البكالوريوس في هندسة الذكاء الاصطناعي وعلوم البيانات في كلية راجاجيري للتكنولوجيا.",
                aboutP2: "بينما ينصب تركيزي الأساسي على نماذج الذكاء الاصطناعي، لدي خبرة في الروبوتات وتطبيقات الجوال وإنترنت الأشياء.",
                aboutP3: "أنا من كولام، كيرالا، الهند، وولدت ونشأت في الكويت. أستمتع باكتشاف التقنيات وحل المشكلات المعقدة.",
                timelineSkillsTitle: "الجدول الزمني والمهارات",
                experienceTitle: "الخبرة والمسار التعليمي",
                exp1Date: "٢٠٢٦ — الآن", exp1Desc: "متدرب مهندس برمجيات @ ThoughtMinds (بناء حلول برمجية ذكية وقابلة للتطوير)",
                exp2Date: "٢٠٢٣ — الآن", exp2Desc: "بكالوريوس في الذكاء الاصطناعي وعلوم البيانات @ كلية راجاجيري للتكنولوجيا (RSET)",
                exp3Date: "٢٠٢١ — ٢٠٢٣", exp3Desc: "التعليم الثانوي العالي @ المدرسة الهندية الأهلية بالكويت (نجاح بنسبة ٩٥٪)",
                exp4Date: "٢٠١٩ — ٢٠٢١", exp4Desc: "التعليم الثانوي @ المدرسة الهندية الأهلية بالكويت (نجاح بنسبة ٩٤٪)",
                techSkillsTitle: "المهارات التقنية",
                skill1Title: "بايثون", skill1Desc: "معرفة متقدمة تركز على تدريب ونشر نماذج الذكاء الاصطناعي.",
                skill2Title: "إنترنت الأشياء", skill2Desc: "خبرة في لوحات ESP32 و ESP8266 وبيئة أردوينو.",
                skill3Title: "أندرويد", skill3Desc: "معرفة أساسية في تطوير تطبيقات أندرويد عبر أندرويد ستوديو.",
                skill4Title: "التعرف على الأشياء", skill4Desc: "خبرة في نماذج YOLO وضبط المعلمات الفائقة.",
                skill5Title: "جافا", skill5Desc: "أساسيات البرمجة كائنية التوجه (OOP).",
                skill6Title: "الروبوتات", skill6Desc: "خبرة في الحركيات والميكانيكا للأذرع الروبوتية.",
                projectsTitle: "مشاريعي",
                p1Title: "بانشي (Banshee)", p1Desc: "نظام منبه متقدم بمفاتيح فيزيائية وصفارات إنذار باستخدام ESP32.",
                p2Title: "مسألة الرجل المشنوق", p2Desc: "حل ذاتي لألعاب الجلاد باستخدام خوارزميات البحث بالعمق أولاً (DFS).",
                p3Title: "ريدي-سبيكي", p3Desc: "مشروع روبوت دردشة ذكي يلخص الوثائق والملفات المدخلة بدقة.",
                p4Title: "حركيات SCARA", p4Desc: "برنامج بايثون لحساب الحركيات المباشرة والعكسية لذراع SCARA ثنائي المحاور.",
                p5Title: "كشف الأشخاص", p5Desc: "نظام مراقبة ذكي باستخدام YOLO v8 لكشف الأفراد وإرسال تنبيهات فورية.",
                p6Title: "جامبي (Jumpy)", p6Desc: "محول KVM عبر الشبكة المحلية للتبديل السلس بين ويندوز ولينكس.",
                p7Title: "وكيل QWOP الذكي", p7Desc: "نظام تجريبي بالتعلم المعزز للتحكم بلعبة الفلاش الشهيرة QWOP.",
                p8Title: "نظام الإدخال العصبي", p8Desc: "واجهة لمساعدة المستخدمين على التحكم في المؤشر عبر إشارات العين (EOG).",
                p9Title: "كيو آر كود (QRCOD)", p9Desc: "نظام اتصال بصري مبتكر لنقل البيانات بين الحواسيب عبر رموز QR والكاميرا.",
                contactTitle: "تواصل معي",
                lblContactName: "الاسم:", lblEmail: "البريد الإلكتروني:", lblPhone: "الهاتف:", lblAddress: "العنوان:",
                contactAddressVal: "راجاجيري، كوتشي، كيرالا",
                footerCopy: "جويل فيليب بينوي | كلية راجاجيري كوتشي",
                weatherFeelsLike: "يبدو كأنه", weatherHumidity: "الرطوبة", weatherWind: "الرياح"
            },
            ta: {
                navHome: "முகப்பு", navAbout: "என்னை பற்றி", navSkills: "திறன்கள்", navProjects: "திட்டங்கள்", navContact: "தொடர்பு",
                aboutTitle: "என்னை பற்றி",
                aboutP1: "நான் ராஜகிரி பொறியியல் மற்றும் தொழில்நுட்பக் கல்லூரியில் AI மற்றும் தரவு அறிவியல் இளங்கலை பயிலும் மாணவன்.",
                aboutP2: "எனது முக்கிய கவனம் AI மாதிரிகள் மீது இருந்தாலும், ரோபாட்டிக்ஸ், மொபைல் ஆப் மற்றும் IoT ஆகியவற்றிலும் பணியாற்றியுள்ளேன்.",
                aboutP3: "நான் கொல்லம், கேரளா பூர்வீகமாகக் கொண்டவன், ஆனால் குவைத்தில் பிறந்து வளர்ந்தவன். புதிய தொழில்நுட்பங்களை ஆராய்வதில் விருப்பம் உண்டு.",
                timelineSkillsTitle: "காலவரிசை & திறன்கள்",
                experienceTitle: "அனுபவம் & கல்வி காலவரிசை",
                exp1Date: "2026 — தற்போது வரை", exp1Desc: "மென்பொருள் பொறியாளர் பயிற்சியாளர் @ ThoughtMinds (அறிவார்ந்த மென்பொருள் உருவாக்கம்)",
                exp2Date: "2023 — தற்போது வரை", exp2Desc: "B.Tech AI & Data Science @ ராஜகிரி பொறியியல் கல்லூரி (RSET)",
                exp3Date: "2021 — 2023", exp3Desc: "மேல்நிலைக் கல்வி @ இந்தியன் கம்யூனிட்டி பள்ளி குவைத் (95% மதிப்பெண்)",
                exp4Date: "2019 — 2021", exp4Desc: "உயர்நிலைக் கல்வி @ இந்தியன் கம்யூனிட்டி பள்ளி குவைத் (94% மதிப்பெண்)",
                techSkillsTitle: "தொழில்நுட்ப திறன்கள்",
                skill1Title: "பைத்தான்", skill1Desc: "AI பயிற்சி மற்றும் வரிசைப்படுத்தலில் ஆழ்ந்த அறிவு.",
                skill2Title: "IoT", skill2Desc: "ESP32, ESP8266 மற்றும் Arduino அனுபவம்.",
                skill3Title: "ஆண்ட்ராய்டு", skill3Desc: "Android Studio பயன்பாட்டு மேம்பாடு அறிவு.",
                skill4Title: "பொருள் கண்டறிதல்", skill4Desc: "YOLO மாதிரிகள் மற்றும் அளவுரு சரிசெய்தல் அனுபவம்.",
                skill5Title: "ஜாவா", skill5Desc: "பொருள் சார்ந்த நிரலாக்க அடித்தளம்.",
                skill6Title: "ரோபாட்டிக்ஸ்", skill6Desc: "ரோபோ கைகள் இயக்கவியல் அனுபவம்.",
                projectsTitle: "எனது திட்டங்கள்",
                p1Title: "பான்ஷி (Banshee)", p1Desc: "ESP32 அடிப்படையிலான எச்சரிக்கை மணி அலாரம் அமைப்பு.",
                p2Title: "ஹேங்மேன் புதிர்", p2Desc: "DFS தேடல் மூலம் ஹேங்மேன் விளையாட்டை தானாகத் தீர்க்கும் அமைப்பு.",
                p3Title: "ரீடி-ஸ்பீக்கி", p3Desc: "ஆவணங்களை சுருக்கி வழங்கும் AI சாட்பாட் திட்டம்.",
                p4Title: "ஸ்காரா இயக்கவியல்", p4Desc: "2DOF SCARA ரோபோ கைக்கான முன்னோக்கு மற்றும் தலைகீழ் இயக்கவியல் பைத்தான் நிரல்.",
                p5Title: "மனிதன் கண்டறிதல்", p5Desc: "YOLO v8 மூலம் மனிதர்களைக் கண்டறிந்து மின்னஞ்சல் அனுப்பும் கண்காணிப்பு அமைப்பு.",
                p6Title: "ஜம்பி (Jumpy)", p6Desc: "Windows மற்றும் Linux இடையே எளிதாக மாற உதவும் LAN அடிப்படையிலான KVM ஸ்விட்ச்.",
                p7Title: "QWOP RL ஏஜென்ட்", p7Desc: "ரீஇன்ஃபோர்ஸ்மென்ட் கற்றல் மூலம் QWOP விளையாட்டை இயக்கும் அமைப்பு.",
                p8Title: "நரம்பு உள்ளீட்டு அமைப்பு", p8Desc: "கண் அசைவு சிக்னல்கள் மூலம் கர்சரை இயக்கும் மருத்துவ இடைமுகம்.",
                p9Title: "QRCOD", p9Desc: "கேமரா மற்றும் QR குறியீடுகளைப் பயன்படுத்தி கணினிகளுக்கு இடையே தகவல் தொடர்பு.",
                contactTitle: "தொடர்பு கொள்ள",
                lblContactName: "பெயர்:", lblEmail: "மின்னஞ்சல்:", lblPhone: "தொலைபேசி:", lblAddress: "முகவரி:",
                contactAddressVal: "RSET கொச்சி, கேரளா",
                footerCopy: "ஜோயல் பிலிப் பினோய் | RSET கொச்சி",
                weatherFeelsLike: "உணரப்படுவது", weatherHumidity: "ஈரப்பதம்", weatherWind: "காற்று"
            },
            ml: {
                navHome: "ഹോം", navAbout: "എന്നെക്കുറിച്ച്", navSkills: "വൈദഗ്ധ്യം", navProjects: "പ്രോജക്റ്റുകൾ", navContact: "ബന്ധപ്പെടുക",
                aboutTitle: "എന്നെക്കുറിച്ച്",
                aboutP1: "രാജഗിരി സ്കൂൾ ഓഫ് എൻജിനീയറിങ് & ടെക്നോളജിയിൽ ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസ് & ഡാറ്റാ സയൻസ് ബി.ടെക് വിദ്യാർത്ഥിയാണ് ഞാൻ.",
                aboutP2: "എന്റെ പ്രധാന ശ്രദ്ധ AI മോഡലുകളിലാണെങ്കിലും, റോബോട്ടിക്സ്, മൊബൈൽ ആപ്പ്, IoT എന്നിവയിലും ഞാൻ പ്രവർത്തിക്കുന്നു.",
                aboutP3: "കൊല്ലം സ്വദേശിയാണെങ്കിലും ജനിച്ചതും വളർന്നതും കുവൈറ്റിലാണ്. പുതിയ സാങ്കേതികവിദ്യകൾ പര്യവേക്ഷണം ചെയ്യാൻ ഞാൻ ഇഷ്ടപ്പെടുന്നു.",
                timelineSkillsTitle: "ടൈംലൈൻ & കഴിവുകൾ",
                experienceTitle: "പരിചയവും വിദ്യാഭ്യാസ ടൈംലൈനും",
                exp1Date: "2026 — നിലവിൽ", exp1Desc: "സോഫ്റ്റ്‌വെയർ എഞ്ചിനീയർ ഇന്റേൺ @ തോട്ട്മൈൻഡ്സ് (ThoughtMinds)",
                exp2Date: "2023 — നിലവിൽ", exp2Desc: "ബി.ടെക് AI & ഡാറ്റാ സയൻസ് @ രാജഗിരി എൻജിനീയറിങ് കോളേജ് (RSET)",
                exp3Date: "2021 — 2023", exp3Desc: "ഹയർ സെക്കൻഡറി വിദ്യാഭ്യാസം @ ഇന്ത്യൻ കമ്മ്യൂണിറ്റി സ്കൂൾ കുവൈറ്റ് (95%)",
                exp4Date: "2019 — 2021", exp4Desc: "ഹൈസ്കൂൾ വിദ്യാഭ്യാസം @ ഇന്ത്യൻ കമ്മ്യൂണിറ്റി സ്കൂൾ കുവൈറ്റ് (94%)",
                techSkillsTitle: "സാങ്കേതിക കഴിവുകൾ",
                skill1Title: "പൈത്തൺ", skill1Desc: "AI മോഡൽ പരിശീലനത്തിലും വിന്യാസത്തിലും മികച്ച അറിവ്.",
                skill2Title: "IoT", skill2Desc: "ESP32, ESP8266, ആർഡ്വിനോ എന്നിവയിലെ പ്രവൃത്തിപരിചയം.",
                skill3Title: "ആൻഡ്രോയിഡ്", skill3Desc: "ആൻഡ്രോയിഡ് സ്റ്റുഡിയോ വഴിയുള്ള ആപ്പ് നിർമ്മാണ പരിചയം.",
                skill4Title: "ഒബ്ജക്റ്റ് റെക്കഗ്നിഷൻ", skill4Desc: "YOLO മോഡലുകളിലും ഹൈപ്പർപാരാമീറ്റർ ട്യൂണിംഗിലുമുള്ള പരിചയം.",
                skill5Title: "ജാവ", skill5Desc: "ഒബ്ജക്റ്റ് ഓറിയന്റഡ് പ്രോഗ്രാമിംഗ് അടിസ്ഥാനം.",
                skill6Title: "റോബോട്ടിക്സ്", skill6Desc: "റോബോട്ടിക് കൈകളുടെ കൈനമാറ്റിക്സ് വിശകലനം.",
                projectsTitle: "എന്റെ പ്രോജക്റ്റുകൾ",
                p1Title: "ബാൻഷി (Banshee)", p1Desc: "ESP32 ഉപയോഗിച്ച് നിർമ്മിച്ച അലാറം സിസ്റ്റം.",
                p2Title: "ഹാംഗ്മാൻ പ്രോബ്ലം", p2Desc: "DFS സെർച്ച് ഉപയോഗിച്ച് ഹാംഗ്മാൻ ഗെയിം സ്വയം പരിഹരിക്കുന്ന സിസ്റ്റം.",
                p3Title: "റീഡി-സ്പീക്കി", p3Desc: "രേഖകളിൽ നിന്ന് സംഗ്രഹങ്ങൾ നൽകുന്ന AI ചാറ്റ്ബോട്ട്.",
                p4Title: "സ്കാറ കൈനമാറ്റിക്സ്", p4Desc: "2DOF സ്കാറ റോബോട്ട് കൈകൾക്കായുള്ള പൈത്തൺ പ്രോഗ്രാം.",
                p5Title: "പേഴ്സൺ ഡിറ്റക്ഷൻ", p5Desc: "YOLO v8 ഉപയോഗിച്ചുള്ള നിരീക്ഷണ സംവിധാനം.",
                p6Title: "ജമ്പി (Jumpy)", p6Desc: "വിൻഡോസും ലിനക്സും തമ്മിൽ പ്രവർത്തിക്കാൻ സഹായിക്കുന്ന LAN KVM സ്വിച്ച്.",
                p7Title: "QWOP RL ഏജന്റ്", p7Desc: "റീഇൻഫോഴ്‌സ്‌മെന്റ് ലേണിംഗ് അടിസ്ഥാനമാക്കിയുള്ള ഗെയിമിംഗ് സിസ്റ്റം.",
                p8Title: "ന്യൂറൽ ഇൻപുട്ട് സിസ്റ്റം", p8Desc: "കണ്ണുകളുടെ ചലനം വഴി കഴ്‌സർ നിയന്ത്രിക്കാനുള്ള സംവിധാനം.",
                p9Title: "QRCOD", p9Desc: "ക്യാമറകളും ക്യുആർ കോഡുകളും ഉപയോഗിച്ചുള്ള ഡാറ്റാ വിനിമയ സിസ്റ്റം.",
                contactTitle: "ബന്ധപ്പെടുക",
                lblContactName: "പേര്:", lblEmail: "ഇമെയിൽ:", lblPhone: "ഫോൺ:", lblAddress: "വിലാസം:",
                contactAddressVal: "RSET കൊച്ചി, കേരളം",
                footerCopy: "ജോയൽ ഫിലിപ്പ് ബിനോയ് | RSET കൊച്ചി",
                weatherFeelsLike: "അനുഭവപ്പെടുന്നത്", weatherHumidity: "ഈർപ്പം", weatherWind: "കാറ്റ്"
            },
            ru: {
                navHome: "Главная", navAbout: "О себе", navSkills: "Навыки", navProjects: "Проекты", navContact: "Контакты",
                aboutTitle: "Обо мне",
                aboutP1: "Студент бакалавриата по направлению ИИ и наука о данных в Инженерно-технологическом институте Раджагири (RSET).",
                aboutP2: "Основное внимание уделяю моделям ИИ, а также робототехнике, мобильной разработке и IoT.",
                aboutP3: "Родом из Коллама (Керала, Индия), родился и вырос в Кувейте. Увлечен изучением передовых технологий и решением сложных задач.",
                timelineSkillsTitle: "Таймлайн и навыки",
                experienceTitle: "Опыт работы и образование",
                exp1Date: "2026 — Наст. время", exp1Desc: "Стажер-разработчик ПО @ ThoughtMinds (Интеллектуальные масштабируемые решения)",
                exp2Date: "2023 — Наст. время", exp2Desc: "Бакалавр ИИ и науки о данных @ Инженерный институт Раджагири (RSET)",
                exp3Date: "2021 — 2023", exp3Desc: "Старшая средняя школа @ Indian Community School Kuwait (95% баллов)",
                exp4Date: "2019 — 2021", exp4Desc: "Средняя школа @ Indian Community School Kuwait (94% баллов)",
                techSkillsTitle: "Технические навыки",
                skill1Title: "Python", skill1Desc: "Глубокие знания, фокус на обучении и деплое моделей искусственного интеллекта.",
                skill2Title: "IoT", skill2Desc: "Опыт работы с ESP32, ESP8266 и средой Arduino IDE.",
                skill3Title: "Android", skill3Desc: "Базовые знания разработки мобильных приложений в Android Studio.",
                skill4Title: "Распознавание объектов", skill4Desc: "Опыт работы с моделями YOLO и настройкой гиперпараметров.",
                skill5Title: "Java", skill5Desc: "Фундаментальные основы объектно-ориентированного программирования.",
                skill6Title: "Робототехника", skill6Desc: "Опыт расчетов прямой и обратной кинематики манипуляторов.",
                projectsTitle: "Мои проекты",
                p1Title: "Банши (Banshee)", p1Desc: "Продвинутая система будильника с физическими переключателями и сиреной на ESP32.",
                p2Title: "Проблема Виселицы", p2Desc: "Автономное решение игры в виселицу с помощью поиска в глубину (DFS).",
                p3Title: "Readie-speakie", p3Desc: "Чат-бот для создания кратких резюме на основе загруженных документов.",
                p4Title: "Кинематика SCARA", p4Desc: "Программа на Python для расчета кинематики 2DOF манипулятора SCARA.",
                p5Title: "Детекция людей", p5Desc: "Система видеонаблюдения на YOLO v8 для распознавания людей и отправки оповещений.",
                p6Title: "Jumpy", p6Desc: "Сетевой KVM-переключатель для бесшовного управления Windows и Linux.",
                p7Title: "QWOP RL Агент", p7Desc: "Экспериментальная система обучения с подкреплением для прохождения флеш-игры QWOP.",
                p8Title: "Нейроинтерфейс ввода", p8Desc: "Интерфейс для управления курсором мыши с помощью сигналов движения глаз (EOG).",
                p9Title: "QRCOD", p9Desc: "Оптическая система передачи данных между компьютерами через камеры и динамические QR-коды.",
                contactTitle: "Связаться",
                lblContactName: "Имя:", lblEmail: "Email:", lblPhone: "Телефон:", lblAddress: "Адрес:",
                contactAddressVal: "RSET Кочи, Керала",
                footerCopy: "Джоэл Филип Биной | RSET Кочи",
                weatherFeelsLike: "Ощущается как", weatherHumidity: "Влажность", weatherWind: "Ветер"
            },
            hi: {
                navHome: "होम", navAbout: "मेरे बारे में", navSkills: "कौशल", navProjects: "प्रोजेक्ट्स", navContact: "संपर्क",
                aboutTitle: "मेरे बारे में",
                aboutP1: "मैं राजागिरी स्कूल ऑफ इंजीनियरिंग एंड टेक्नोलॉजी में एआई और डेटा साइंस में बी.टेक का छात्र हूं।",
                aboutP2: "एआई मॉडल के साथ-साथ मुझे रोबोटिक्स, मोबाइल ऐप डेवलपमेंट और आईओटी में भी गहरी रुचि है।",
                aboutP3: "मैं कोल्लम, केरल से हूं, पर मेरा जन्म और पालन-पोषण कुवैत में हुआ। मुझे नई तकनीकों को एक्सप्लोर करना पसंद है।",
                timelineSkillsTitle: "टाइमलाइन और कौशल",
                experienceTitle: "अनुभव और शिक्षा टाइमलाइन",
                exp1Date: "2026 — वर्तमान", exp1Desc: "सॉफ्टवेयर इंजीनियर इंटर्न @ ThoughtMinds (स्मार्ट और स्केलेबल समाधान निर्माण)",
                exp2Date: "2023 — वर्तमान", exp2Desc: "बी.टेक एआई और डेटा साइंस @ राजागिरी इंजीनियरिंग कॉलेज (RSET)",
                exp3Date: "2021 — 2023", exp3Desc: "उच्चतर माध्यमिक शिक्षा @ इंडियन कम्युनिटी स्कूल कुवैत (95%)",
                exp4Date: "2019 — 2021", exp4Desc: "माध्यमिक शिक्षा @ इंडियन कम्युनिटी स्कूल कुवैत (94%)",
                techSkillsTitle: "तकनीकी कौशल",
                skill1Title: "पायथन", skill1Desc: "एआई मॉडल प्रशिक्षण और डिप्लॉयमेंट में प्रवीण ज्ञान।",
                skill2Title: "आईओटी (IoT)", skill2Desc: "ESP32, ESP8266 और Arduino IDE में व्यावहारिक अनुभव।",
                skill3Title: "एंड्रॉइड", skill3Desc: "Android Studio में मोबाइल ऐप डेवलपमेंट का बुनियादी ज्ञान।",
                skill4Title: "ऑब्जेक्ट पहचान", skill4Desc: "YOLO मॉडल और हाइपरपैरामीटर ट्यूनिंग में अनुभव।",
                skill5Title: "जावा", skill5Desc: "ऑब्जेक्ट ओरिएंटेड प्रोग्रामिंग की मजबूत नींव।",
                skill6Title: "रोबोटिक्स", skill6Desc: "रोबोटिक आर्म्स किनेमैटिक्स में अनुभव।",
                projectsTitle: "मेरे प्रोजेक्ट्स",
                p1Title: "बांशी (Banshee)", p1Desc: "ESP32 पर आधारित फिजिकल स्विच और सायरन वाला स्मार्ट अलार्म सिस्टम।",
                p2Title: "हैंगमैन पहेली", p2Desc: "DFS खोज एल्गोरिथ्म का उपयोग करके हैंगमैन गेम को स्वचालित रूप से हल करने वाला सिस्टम।",
                p3Title: "रीडी-स्पीकी", p3Desc: "दस्तावेजों के आधार पर त्वरित सारांश तैयार करने वाला एआई चैटबॉट।",
                p4Title: "SCARA किनेमैटिक्स", p4Desc: "2DOF SCARA रोबोट आर्म के फॉरवर्ड और इनवर्स किनेमैटिक्स की गणना हेतु पायथन प्रोग्राम।",
                p5Title: "व्यक्ति पहचान", p5Desc: "YOLO v8 द्वारा व्यक्तियों का पता लगाने और ईमेल अलर्ट भेजने वाला सुरक्षा सिस्टम।",
                p6Title: "जंपी (Jumpy)", p6Desc: "Windows और Linux के बीच सहज स्विचिंग के लिए LAN आधारित KVM स्विच।",
                p7Title: "QWOP RL एजेंट", p7Desc: "रीइन्फोर्समेंट लर्निंग द्वारा फ्लैश गेम QWOP खेलने वाला एआई एजेंट।",
                p8Title: "न्यूरल इनपुट सिस्टम", p8Desc: "EOG सिग्नल (आंखों की गति) के माध्यम से कर्सर नेविगेट करने वाला इंटरफेस।",
                p9Title: "QRCOD", p9Desc: "कैमरे और क्यूआर कोड के जरिए कंप्यूटरों के बीच सीधा डेटा संचार तंत्र।",
                contactTitle: "संपर्क करें",
                lblContactName: "नाम:", lblEmail: "ईमेल:", lblPhone: "फ़ोन:", lblAddress: "पता:",
                contactAddressVal: "RSET कोच्चि, केरल",
                footerCopy: "जोएल फिलिप बिनॉय | RSET कोच्चि",
                weatherFeelsLike: "महसूस", weatherHumidity: "आर्द्रता", weatherWind: "हवा"
            }
        };

        let currentLangIdx = 0;
        let activeSiteLang = "en";
        let translationInterval = null;
        let nameAnimFrame = null;
        let isNameHovered = false;

        function getTargetText(langObj) {
            return `${langObj.first} ${langObj.middle} ${langObj.last}`;
        }

        function renderName(langObj) {
            if (typeof langObj === 'string') {
                heroNameEl.textContent = langObj;
                return;
            }
            heroNameEl.innerHTML = `${langObj.first} <span class="middle-name">${langObj.middle} </span>${langObj.last}`;
        }

        function transitionToLanguage(langObj) {
            if (nameAnimFrame) cancelAnimationFrame(nameAnimFrame);

            const targetText = getTargetText(langObj);
            heroNameEl.textContent = targetText;
            heroNameEl.style.fontSize = "";

            const scrambleDuration = 120;
            const crackDuration = 380;
            const totalDuration = scrambleDuration + crackDuration;
            const startTime = performance.now();
            const textLength = targetText.length;
            const customChars = langObj.chars || scrambleChars;

            function runCycle(now) {
                if (!isNameHovered && activeSiteLang === "en") return;

                const elapsed = now - startTime;

                if (elapsed < scrambleDuration) {
                    let output = "";
                    for (let i = 0; i < textLength; i++) {
                        if (targetText[i] === " " || targetText[i] === "·") {
                            output += targetText[i];
                        } else {
                            output += customChars[Math.floor(Math.random() * customChars.length)];
                        }
                    }
                    heroNameEl.textContent = output;
                } else {
                    const crackProgress = Math.min(1, (elapsed - scrambleDuration) / crackDuration);
                    const revealedChars = Math.floor(crackProgress * textLength);

                    let output = "";
                    for (let i = 0; i < textLength; i++) {
                        const originalChar = targetText[i];
                        if (originalChar === " " || originalChar === "·") {
                            output += originalChar;
                        } else if (i < revealedChars) {
                            output += originalChar;
                        } else {
                            output += customChars[Math.floor(Math.random() * customChars.length)];
                        }
                    }
                    heroNameEl.textContent = output;

                    if (crackProgress >= 1) {
                        renderName(langObj);
                        return;
                    }
                }

                if (elapsed < totalDuration) {
                    nameAnimFrame = requestAnimationFrame(runCycle);
                } else {
                    renderName(langObj);
                }
            }

            nameAnimFrame = requestAnimationFrame(runCycle);
        }

        // Glitch element transition helper
        function glitchElementToText(element, targetText, glyphPool, delayMs = 0) {
            if (!element || !targetText) return;
            setTimeout(() => {
                const startTime = performance.now();
                const textLength = targetText.length;
                const scrambleDuration = 140 + Math.random() * 80;
                const crackDuration = 320 + Math.random() * 150;
                const totalDuration = scrambleDuration + crackDuration;

                function step(now) {
                    const elapsed = now - startTime;
                    if (elapsed < scrambleDuration) {
                        let out = "";
                        for (let i = 0; i < textLength; i++) {
                            if (targetText[i] === " " || targetText[i] === "\n") out += targetText[i];
                            else out += glyphPool[Math.floor(Math.random() * glyphPool.length)];
                        }
                        element.textContent = out;
                    } else {
                        const progress = Math.min(1, (elapsed - scrambleDuration) / crackDuration);
                        const revealed = Math.floor(progress * textLength);
                        let out = "";
                        for (let i = 0; i < textLength; i++) {
                            const c = targetText[i];
                            if (c === " " || c === "\n") out += c;
                            else if (i < revealed) out += c;
                            else out += glyphPool[Math.floor(Math.random() * glyphPool.length)];
                        }
                        element.textContent = out;
                        if (progress >= 1) {
                            element.textContent = targetText;
                            return;
                        }
                    }
                    if (elapsed < totalDuration) {
                        requestAnimationFrame(step);
                    } else {
                        element.textContent = targetText;
                    }
                }
                requestAnimationFrame(step);
            }, delayMs);
        }

        // Glitch full site into the target language
        function triggerSiteGlitchToLanguage(langId) {
            window.currentSiteLang = langId;
            const langData = siteTranslations[langId] || siteTranslations.en;
            const langObj = nameTranslations.find(l => l.id === langId) || nameTranslations[0];
            const glyphs = langObj.chars || scrambleChars;

            // 1. Nav links
            const navLinkEls = document.querySelectorAll('.nav-links .nav-item');
            const navKeys = ['navHome', 'navAbout', 'navSkills', 'navProjects', 'navContact'];
            navLinkEls.forEach((el, idx) => {
                if (navKeys[idx] && langData[navKeys[idx]]) {
                    glitchElementToText(el, langData[navKeys[idx]], glyphs, idx * 25);
                }
            });

            // 2. Weather Widget Text
            const weatherDiv = document.getElementById('weather');
            if (weatherDiv && window.currentWeatherData) {
                const data = window.currentWeatherData;
                const condition = window.currentWeatherCondition || data.weather[0].main;
                const feelsLike = Math.round(data.main.feels_like);
                const humidity = data.main.humidity;
                const windSpeed = data.wind.speed;

                const detailsP = weatherDiv.querySelector('.weather-details');
                const extraP = weatherDiv.querySelector('.weather-extra');
                if (detailsP) {
                    const newDetails = `${condition} | ${langData.weatherFeelsLike}: ${feelsLike}°C`;
                    glitchElementToText(detailsP, newDetails, glyphs, 40);
                }
                if (extraP) {
                    const newExtra = `${langData.weatherHumidity}: ${humidity}% | ${langData.weatherWind}: ${windSpeed} m/s`;
                    glitchElementToText(extraP, newExtra, glyphs, 60);
                }
            }

            // 3. Section Titles
            const aboutTitleEl = document.querySelector('#about .section-title');
            if (aboutTitleEl) glitchElementToText(aboutTitleEl, langData.aboutTitle, glyphs, 50);

            const timelineSkillsTitleEl = document.querySelector('#skills .section-title');
            if (timelineSkillsTitleEl) glitchElementToText(timelineSkillsTitleEl, langData.timelineSkillsTitle, glyphs, 70);

            const subSectionTitles = document.querySelectorAll('#skills .subsection-title');
            if (subSectionTitles[0]) glitchElementToText(subSectionTitles[0], langData.experienceTitle, glyphs, 90);
            if (subSectionTitles[1]) glitchElementToText(subSectionTitles[1], langData.techSkillsTitle, glyphs, 110);

            const projectsTitleEl = document.querySelector('#projects .section-title');
            if (projectsTitleEl) glitchElementToText(projectsTitleEl, langData.projectsTitle, glyphs, 130);

            const contactTitleEl = document.querySelector('#contact .section-title');
            if (contactTitleEl) glitchElementToText(contactTitleEl, langData.contactTitle, glyphs, 150);

            // 4. About paragraphs
            const aboutParas = document.querySelectorAll('#about .about-text p');
            if (aboutParas[0]) glitchElementToText(aboutParas[0], langData.aboutP1, glyphs, 60);
            if (aboutParas[1]) glitchElementToText(aboutParas[1], langData.aboutP2, glyphs, 80);
            if (aboutParas[2]) glitchElementToText(aboutParas[2], langData.aboutP3, glyphs, 100);

            // 5. Timeline Cards
            const expSquares = document.querySelectorAll('#skills .grid-container:nth-of-type(1) .square');
            const expKeys = [
                { date: 'exp1Date', desc: 'exp1Desc' },
                { date: 'exp2Date', desc: 'exp2Desc' },
                { date: 'exp3Date', desc: 'exp3Desc' },
                { date: 'exp4Date', desc: 'exp4Desc' }
            ];
            expSquares.forEach((sq, idx) => {
                if (expKeys[idx]) {
                    const titleP = sq.querySelector('.square-title');
                    const itemEl = sq.querySelector('.square-item');
                    if (titleP && langData[expKeys[idx].date]) glitchElementToText(titleP, langData[expKeys[idx].date], glyphs, 70 + idx * 20);
                    if (itemEl && langData[expKeys[idx].desc]) {
                        itemEl.setAttribute('data-original-text', langData[expKeys[idx].desc]);
                        glitchElementToText(itemEl, langData[expKeys[idx].desc], glyphs, 90 + idx * 20);
                    }
                }
            });

            // 6. Skills Cards
            const skillSquares = document.querySelectorAll('#skills .grid-container:nth-of-type(2) .square');
            const skillKeys = [
                { title: 'skill1Title', desc: 'skill1Desc' },
                { title: 'skill2Title', desc: 'skill2Desc' },
                { title: 'skill3Title', desc: 'skill3Desc' },
                { title: 'skill4Title', desc: 'skill4Desc' },
                { title: 'skill5Title', desc: 'skill5Desc' },
                { title: 'skill6Title', desc: 'skill6Desc' }
            ];
            skillSquares.forEach((sq, idx) => {
                if (skillKeys[idx]) {
                    const titleP = sq.querySelector('.square-title');
                    const itemEl = sq.querySelector('.square-item');
                    if (titleP && langData[skillKeys[idx].title]) glitchElementToText(titleP, langData[skillKeys[idx].title], glyphs, 100 + idx * 20);
                    if (itemEl && langData[skillKeys[idx].desc]) {
                        itemEl.setAttribute('data-original-text', langData[skillKeys[idx].desc]);
                        glitchElementToText(itemEl, langData[skillKeys[idx].desc], glyphs, 120 + idx * 20);
                    }
                }
            });

            // 7. Project Cards (Titles and Descriptions)
            const projCards = document.querySelectorAll('.projects-section .project-items');
            const projectKeys = [
                { title: 'p1Title', desc: 'p1Desc' },
                { title: 'p2Title', desc: 'p2Desc' },
                { title: 'p3Title', desc: 'p3Desc' },
                { title: 'p4Title', desc: 'p4Desc' },
                { title: 'p5Title', desc: 'p5Desc' },
                { title: 'p6Title', desc: 'p6Desc' },
                { title: 'p7Title', desc: 'p7Desc' },
                { title: 'p8Title', desc: 'p8Desc' },
                { title: 'p9Title', desc: 'p9Desc' }
            ];
            projCards.forEach((card, idx) => {
                if (projectKeys[idx]) {
                    const h3 = card.querySelector('h3');
                    const desc = card.querySelector('.project-contents');
                    if (h3 && langData[projectKeys[idx].title]) glitchElementToText(h3, langData[projectKeys[idx].title], glyphs, 120 + idx * 15);
                    if (desc && langData[projectKeys[idx].desc]) {
                        const targetD = langData[projectKeys[idx].desc];
                        desc.setAttribute('data-target-text', targetD);
                        // Refresh idle cryptic state to match length and language glyphs
                        desc.textContent = getRandomGibberish(targetD.length, targetD);
                    }
                }
            });

            // 8. Contact details
            const contactParas = document.querySelectorAll('#contact .contact-text p');
            if (contactParas[0]) contactParas[0].innerHTML = `<strong>${langData.lblContactName}</strong> ${langObj.full}`;
            if (contactParas[1]) contactParas[1].innerHTML = `<strong>${langData.lblEmail}</strong> joelmammoodan@gmail.com`;
            if (contactParas[2]) contactParas[2].innerHTML = `<strong>${langData.lblPhone}</strong> +91 9061225532`;
            if (contactParas[3]) contactParas[3].innerHTML = `<strong>${langData.lblAddress}</strong> ${langData.contactAddressVal}`;

            // 9. Footer
            const footerEl = document.querySelector('.footer p');
            if (footerEl && langData.footerCopy) {
                const year = new Date().getFullYear();
                footerEl.innerHTML = `${langData.footerCopy} &copy; <span id="year">${year}</span>`;
            }

            // Sync body language class for responsive top nav & appbar spacing
            document.body.classList.remove('lang-ml', 'lang-ta', 'lang-ru', 'lang-hi', 'lang-ar', 'lang-en');
            document.body.classList.add(`lang-${langId}`);

            // Transient visual scanline pulse
            document.body.classList.add('language-glitch-pulse');
            setTimeout(() => {
                document.body.classList.remove('language-glitch-pulse');
            }, 600);
        }

        let leaveTimeout = null;

        heroNameEl.addEventListener('mouseenter', () => {
            if (leaveTimeout) {
                clearTimeout(leaveTimeout);
                leaveTimeout = null;
            }
            if (isNameHovered) return;

            isNameHovered = true;
            currentLangIdx = (currentLangIdx + 1) % nameTranslations.length;
            if (currentLangIdx === 0) currentLangIdx = 1;

            transitionToLanguage(nameTranslations[currentLangIdx]);

            translationInterval = setInterval(() => {
                currentLangIdx = (currentLangIdx + 1) % nameTranslations.length;
                transitionToLanguage(nameTranslations[currentLangIdx]);
            }, 1500);
        });

        heroNameEl.addEventListener('mouseleave', () => {
            leaveTimeout = setTimeout(() => {
                isNameHovered = false;
                if (translationInterval) clearInterval(translationInterval);
                if (nameAnimFrame) cancelAnimationFrame(nameAnimFrame);

                if (activeSiteLang === "en") {
                    currentLangIdx = 0;
                    heroNameEl.style.fontSize = "";
                    renderName(nameTranslations[0]);
                } else {
                    const currentActiveObj = nameTranslations.find(l => l.id === activeSiteLang) || nameTranslations[0];
                    heroNameEl.style.fontSize = "";
                    renderName(currentActiveObj);
                }
            }, 80);
        });

        // Click to Lock & Glitch the whole page into that language
        heroNameEl.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedLang = nameTranslations[currentLangIdx];
            if (!selectedLang) return;

            if (activeSiteLang === selectedLang.id) {
                // Toggle back to English
                activeSiteLang = "en";
                currentLangIdx = 0;
                heroNameEl.style.fontSize = "";
                renderName(nameTranslations[0]);
                triggerSiteGlitchToLanguage("en");
            } else {
                // Glitch full site into clicked language
                activeSiteLang = selectedLang.id;
                renderName(selectedLang);
                triggerSiteGlitchToLanguage(selectedLang.id);
            }
        });
    }

    // 10. Subtext Links Code-Gibberish Idle & Scramble-Decrypt on Hover
    const socialLinks = document.querySelectorAll('.hero-socials .social-link');

    socialLinks.forEach(link => {
        const clearText = link.textContent.trim();
        link.setAttribute('data-target-text', clearText);
        
        let idleGibberish = getRandomGibberish(clearText.length);
        link.textContent = idleGibberish;

        let linkAnimFrame = null;
        let isLinkHovered = false;

        link.addEventListener('mouseenter', () => {
            isLinkHovered = true;
            if (linkAnimFrame) cancelAnimationFrame(linkAnimFrame);

            const scrambleDuration = 120;
            const crackDuration = 380;
            const totalDuration = scrambleDuration + crackDuration;
            const startTime = performance.now();
            const textLength = clearText.length;

            function runLinkDecryption(now) {
                if (!isLinkHovered) return;

                const elapsed = now - startTime;

                if (elapsed < scrambleDuration) {
                    let output = "";
                    for (let i = 0; i < textLength; i++) {
                        output += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                    }
                    link.textContent = output;
                } else {
                    const crackProgress = Math.min(1, (elapsed - scrambleDuration) / crackDuration);
                    const revealedChars = Math.floor(crackProgress * textLength);

                    let output = "";
                    for (let i = 0; i < textLength; i++) {
                        if (i < revealedChars) {
                            output += clearText[i];
                        } else {
                            output += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                        }
                    }
                    link.textContent = output;

                    if (crackProgress >= 1) {
                        link.textContent = clearText;
                        return;
                    }
                }

                if (elapsed < totalDuration && isLinkHovered) {
                    linkAnimFrame = requestAnimationFrame(runLinkDecryption);
                } else {
                    link.textContent = clearText;
                }
            }

            linkAnimFrame = requestAnimationFrame(runLinkDecryption);
        });

        link.addEventListener('mouseleave', () => {
            isLinkHovered = false;
            if (linkAnimFrame) cancelAnimationFrame(linkAnimFrame);
            // Cycle to a fresh code gibberish on exit
            idleGibberish = getRandomGibberish(clearText.length);
            link.textContent = idleGibberish;
        });
    });

    // 11. Mobile Touch / Tap Support for Timeline & Skill Cards
    const allSquares = document.querySelectorAll('.square');
    allSquares.forEach(sq => {
        sq.addEventListener('click', (e) => {
            // Check if clicking directly on a link inside the revealed card
            if (e.target.tagName === 'A' || e.target.closest('a')) return;
            const isCurrentlyActive = sq.classList.contains('active-touch');
            allSquares.forEach(otherSq => otherSq.classList.remove('active-touch'));
            if (!isCurrentlyActive) {
                sq.classList.add('active-touch');
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.square')) {
            allSquares.forEach(sq => sq.classList.remove('active-touch'));
        }
    });

});



