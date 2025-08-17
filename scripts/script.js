const apiKey="9e8be211c5f50add46e267040c972a3e"
const city="Kochi"


//used to fetch the data for the weather snippet 
fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
  .then(response => response.json())
  .then(data => {
    const weatherDiv = document.getElementById("weather");
    const iconCode = data.weather[0].icon; // Weather icon code from API
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
  

    weatherDiv.innerHTML = `
      <img src="${iconUrl}" alt="Weather" class='weather-icon' width="30" height="30">
      <p>${data.main.temp}°C</p> 
    `;

    

  })
  .catch(error => {
    document.getElementById("weather").innerHTML = "<p>⚠</p>";
    console.error(error);
  });


//function to call weather in the weather html page
//kept 2 separate ones since both give different sets of data

function loadWeather(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
    .then(response => response.json())
    .then(data => {
      const cityName = document.getElementById("cityName");
      const temperature = document.getElementById("temperature");
      const condition = document.getElementById("condition");
      const humidity = document.getElementById("humidity");
      const wind = document.getElementById("wind");
      const pressure = document.getElementById("pressure");
      const weatherIcon = document.getElementById("weatherIcon");

      if (data.cod !== 200) {
        // Just update texts, don’t destroy the structure
        cityName.textContent = "❌ City not found";
        temperature.textContent = "";
        condition.textContent = "";
        humidity.textContent = "";
        wind.textContent = "";
        pressure.textContent = "";
        weatherIcon.style.display = "none";
        return;
      }

      // Normal case → fill in details
      cityName.textContent = data.name;
      temperature.textContent = `${data.main.temp}°C`;
      condition.textContent = `${data.weather[0].description}`;
      humidity.textContent = `${data.main.humidity}%`;
      wind.textContent = ` ${data.wind.speed} m/s`;

      const iconCode = data.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      weatherIcon.src = iconUrl;
      weatherIcon.style.display = "inline-block";
    })
    .catch(error => {
      console.error(error);
      document.getElementById("cityName").textContent = "⚠ Error loading weather";
    });
}



//load the articles from dev.to to the div
async function loadArticles(tag, containerId) {
  const res = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=10`);
  const data = await res.json();

  const container = document.getElementById(containerId);

  // Clear the container before adding new articles
  container.innerHTML += ""; 

  data.forEach(article => {
    const div = document.createElement('div');
    div.classList.add('article');
    div.innerHTML = `
      <img src="${article.social_image}" alt="${article.title}">
      <a href="${article.url}" target="_blank">${article.title}</a>
    `;
    container.appendChild(div);
  });
}


// Load Robotics into #news-2
loadArticles('robotics', 'news-2');



//function for the greeting in main page
function getGreeting() {
  const now = new Date();
  const hour = now.getHours(); // 0 - 23

  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Hello There";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const greetingElement = document.getElementById("greetings");
  greetingElement.innerHTML = getGreeting() + "<br>I'm Joel Binoy";
});


//for the slideshow to occur
document.addEventListener('DOMContentLoaded', () => {
    let slides = document.querySelectorAll('.slideshow .slide');
    let dots = document.querySelectorAll('.dot');
    let current = 0;

    function showSlide(index) {
        if (!slides[index] || !dots[index]) return; // safety check

        slides[current].classList.remove('active');
        dots[current].classList.remove('active');

        current = index;

        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function showNextSlide() {
        let next = (current + 1) % slides.length;
        showSlide(next);
    }

    // Dot click
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            let index = parseInt(dot.getAttribute('data-index'));
            showSlide(index);
        });
    });

    // Initialize first slide
    showSlide(0);

    // Automatic slideshow every 3 seconds
    setInterval(showNextSlide, 3000);
});



// for the form 
document.getElementById("weatherForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const city = document.getElementById("locationInput").value;
  loadWeather(city);
});

// Load a default city at start (e.g., Kochi)
loadWeather("Kochi");



