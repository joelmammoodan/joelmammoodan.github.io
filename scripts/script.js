const apiKey="9e8be211c5f50add46e267040c972a3e"

const city="Kochi"

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
    document.getElementById("weather").innerHTML = "⚠ Weather unavailable";
    console.error(error);
  });


async function loadArticles(tag, containerId) {
  const res = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=5`);
  const data = await res.json();

  const container = document.getElementById(containerId);

  // Clear the container before adding new articles
  container.innerHTML += ""; // keeping the <h2> in place

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


function getGreeting() {
  const now = new Date();
  const hour = now.getHours(); // 0 - 23

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good evening";
  } else {
    return "Hello There";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const greetingElement = document.getElementById("greetings");
  greetingElement.innerHTML = getGreeting() + "<br>I'm Joel Binoy";
});
