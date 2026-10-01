const apiKey = "9e8be211c5f50add46e267040c972a3e";
const city = "Kochi";

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

    // 1. Fetch Weather for Navbar
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
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
        weatherFormEl.addEventListener("submit", (e) => {
            e.preventDefault();
            const searchCity = locationInputEl.value.trim();
            if (!searchCity) return;
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${apiKey}&units=metric`)
                .then(res => res.json())
                .then(data => {
                    if (data.cod !== 200) {
                        alert(data.message || "City not found");
                        return;
                    }
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
                })
                .catch(err => console.error("Error searching weather:", err));
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

});
