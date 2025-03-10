function updateDateTime() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/kolkata' });
  document.getElementById('currentDate').textContent = date;
  document.getElementById('currentTime').textContent = time;
}
setInterval(updateDateTime, 1000);
updateDateTime();

const apiKey = "570c923d25d987f8170fd287ba93382c";  // Get your API key from OpenWeatherMap
const city = "jodhpur";
const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;


let stPressMax = null;
let stPressMin = null;
let meanSeaPressMax = null;
let meanSeaPressMin = null;
let windMax = null;
let windMin = null;
let windPrevMax = null;
let windPrevMin = null;
let windAvrAngDir = null;
let windAvrAngPrevDir = null;
let windSpeedHistory = [];
let windDirectionHistory = [];

// Variables to store previous day's values
// Load previous day's values from localStorage
let previousDayWindMax = localStorage.getItem("previousDayWindMax") || null;
let previousDayWindMin = localStorage.getItem("previousDayWindMin") || null;
let previousDayWindAvrAngDir = localStorage.getItem("previousDayWindAvrAngDir") || null;

async function fetchWeatherData() {
try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    
    // Extract required values
    const windSpeed = data.wind.speed; // m/s
    const windDirection = data.wind.deg; // degrees
    const temperature = data.main.temp;
    const stationPressure = data.main.pressure;
    const humidity = data.main.humidity;
    const rainfall = data.rain ? data.rain["1h"] || 0 : 0;
    const meanSeaPressure = data.main.sea_level || stationPressure; 

    // Update UI elements
    updateWeatherUI({
      windSpeed,
      windDirection,
      stationPressure,
      meanSeaPressure,
      temperature,
      humidity,
      rainfall
  });
  updateWindValues(windSpeed, windDirection);

  updateMaxMinValues(stationPressure, meanSeaPressure);
    
} catch (error) {
    console.error("Error fetching weather data:", error);
}
}

// --- Functions to update UI ---
function updateWeatherUI(data) {
  // Convert wind speed from m/s to km/h
  const windSpeedKmh = data.windSpeed * 3.6;

  // Update wind speed gauge
  const windSpeedRotation = mapValueToAngle(windSpeedKmh, 0, 24, -90, 90); // Map wind speed (0-24 km/h) to -90° to 90°
  document.getElementById("windSpeedNeedle").style.setProperty("--rotation", `${windSpeedRotation}deg`);
  document.getElementById("windSpeedValue").textContent = `${windSpeedKmh.toFixed(1)} km/h`;

  document.getElementById("WindMax").textContent = windMax !== null ? `${windMax.toFixed(1)} km/h `: "--";
    document.getElementById("WindMin").textContent = windMin !== null ? `${windMin.toFixed(1)} km/h` : "--";
    document.getElementById("WindPrevMax").textContent = previousDayWindMax !== null ? `${previousDayWindMax.toFixed(1)} km/h` : "--";
    document.getElementById("WindPrevMin").textContent = previousDayWindMin !== null ? `${previousDayWindMin.toFixed(1)} km/h` : "--";
  
    // Update wind direction gauge
  const windDirectionRotation = data.windDirection;
  document.getElementById("windDirectionNeedle").style.setProperty("--rotation", `${windDirectionRotation}deg`);
  document.getElementById("windDirectionvalue").textContent = `${data.windDirection}°`;
  document.getElementById("WindAvrAngDir").textContent = windAvrAngDir !== null ? `${windAvrAngDir.toFixed(1)}°` : "--";
  document.getElementById("WindAvrAngPrevDir").textContent = previousDayWindAvrAngDir !== null ? `${previousDayWindAvrAngDir.toFixed(1)}° `: "--";

 // update station  pressure display
  document.getElementById("stationPressure").textContent = `${data.stationPressure.toFixed(2)} hPa`;

  // Update mean sea pressure display
  document.getElementById("meanSeaPressure").textContent = `${data.meanSeaPressure.toFixed(2)} hPa/gpm`;


  // Update temperature
 
  document.getElementById("temperatureValue").textContent = `${data.temperature.toFixed(1)}°C`;
  document.querySelector(".digital-display#temperatureValue").textContent = `${data.temperature.toFixed(1)}°C`;
  
  // Update humidity
  
  document.getElementById("humidityValue").textContent = `${data.humidity}%`;
  document.querySelector(".digital-display#humidityValue").textContent = `${data.humidity}%`;
   
  // Update rainfall
  
  document.getElementById("rainValue").textContent = `${data.rainfall.toFixed(1)} mm`;
  document.querySelector(".digital-display#rainValue").textContent = `${data.rainfall.toFixed(1)} mm`;
  
}



// Fetch weather data on page load
fetchWeatherData();


function updateMaxMinValues(stationPressure, meanSeaPressure) {
    // Update station pressure max/min
    if (stPressMax === null || stationPressure > stPressMax) {
        stPressMax = stationPressure;
        document.getElementById("StPressMax").textContent = stPressMax.toFixed(2);
    }
    if (stPressMin === null || stationPressure < stPressMin) {
        stPressMin = stationPressure;
        document.getElementById("StPressMin").textContent = stPressMin.toFixed(2);
    }

    // Update mean sea pressure max/min
    if (meanSeaPressMax === null || meanSeaPressure > meanSeaPressMax) {
        meanSeaPressMax = meanSeaPressure;
        document.getElementById("MeanSeaPressMax").textContent = meanSeaPressMax.toFixed(2);
    }
    if (meanSeaPressMin === null || meanSeaPressure < meanSeaPressMin) {
        meanSeaPressMin = meanSeaPressure;
        document.getElementById("MeanSeaPressMin").textContent = meanSeaPressMin.toFixed(2);
    }
}


// Function to update wind-related values
function updateWindValues(windSpeed, windDirection) {
    const windSpeedKmh = windSpeed * 3.6; // Convert wind speed to km/h

    // Update max and min wind speeds
    if (windMax === null || windSpeedKmh > windMax) {
        windMax = windSpeedKmh;
    }
    if (windMin === null || windSpeedKmh < windMin) {
        windMin = windSpeedKmh;
    }

    // Store wind speed and direction in history
    windSpeedHistory.push(windSpeedKmh);
    windDirectionHistory.push(windDirection);

    // Calculate average wind direction
    if (windDirectionHistory.length > 0) {
        windAvrAngDir = calculateAverageDirection(windDirectionHistory);
    }

    // Check if it's a new day and update previous day's values
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) { // Check if it's midnight
        // Save current day's values as previous day's values
        previousDayWindMax = windMax;
        previousDayWindMin = windMin;
        previousDayWindAvrAngDir = windAvrAngDir;

        // Save previous day's values to localStorage
        localStorage.setItem("previousDayWindMax", previousDayWindMax);
        localStorage.setItem("previousDayWindMin", previousDayWindMin);
        localStorage.setItem("previousDayWindAvrAngDir", previousDayWindAvrAngDir);

        // Reset current day's values
        windMax = null;
        windMin = null;
        windSpeedHistory = [];
        windDirectionHistory = [];
    }
}

// Helper function to calculate average wind direction
function calculateAverageDirection(directions) {
    let sinSum = 0;
    let cosSum = 0;

    directions.forEach(dir => {
        sinSum += Math.sin(dir * Math.PI / 180);
        cosSum += Math.cos(dir * Math.PI / 180);
    });

    const avgSin = sinSum / directions.length;
    const avgCos = cosSum / directions.length;
    const avgDir = Math.atan2(avgSin, avgCos) * 180 / Math.PI;

    return (avgDir + 360) % 360; // Ensure the result is between 0 and 360 degrees
}
// Helper function to map values to angles
function mapValueToAngle(value, minValue, maxValue, minAngle, maxAngle) {
  return ((value - minValue) / (maxValue - minValue)) * (maxAngle - minAngle) + minAngle;
}

function updateThermometer(thermometerId, value, minValue, maxValue) {
  const thermometer = document.getElementById(thermometerId);
  if (!thermometer) return;

  // Calculate the height percentage based on the value
  const heightPercentage = ((value - minValue) / (maxValue - minValue)) * 100;
  thermometer.style.height = `${heightPercentage}%`;
}


function startWeatherUpdates(interval = 60000) { // Default interval is 60 seconds
    fetchWeatherData(); // Fetch data immediately
    setInterval(fetchWeatherData, interval); // Fetch data periodically
}

document.addEventListener('DOMContentLoaded', function () {
  // const apiKey = "570c923d25d987f8170fd287ba93382c";  // Your OpenWeatherMap API key
  // const city = "jodhpur";
  // const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  // Function to create a chart configuration
  function createChartConfig(title, color) {
      return {
          type: 'line',
          data: {
              labels: Array.from({ length: 21 }, (_, i) => `${i < 10 ? '0' + i : i}.00`),
              datasets: [{
                  label: title,
                  data: Array(21).fill(0).map(() => Math.floor(Math.random() * 20)),
                  borderColor: color,
                  backgroundColor: color.replace('1)', '0.2)'),
                  tension: 0.1,
              }]
          },
          options: {
              plugins: {
                  title: {
                      display: true,
                      font: { size: 16 },
                      padding: { top: 3, bottom: -20 }
                  },
                  legend: {
                      display: true,
                      position: 'top',
                      labels: {
                          color: 'purple',
                          font: { size: 12 }
                      }
                  }
              },
              scales: {
                  y: {
                      beginAtZero: true,
                      ticks: { stepSize: 5, min: 0, max: 20 },
                      title: { display: true, text: 'Values' }
                  },
                  x: { title: { display: true, text: 'Time' } }
              },
              responsive: true,
              maintainAspectRatio: false,
          }
      };
  }

  // Initialize all charts
  const temperatureChart = new Chart(document.getElementById('temperatureCanvas').getContext('2d'), createChartConfig('Temperature', 'rgba(255, 99, 132, 1)'));
  const humidityChart = new Chart(document.getElementById('humidityCanvas').getContext('2d'), createChartConfig('Humidity', 'rgba(54, 162, 235, 1)'));
  const windChart = new Chart(document.getElementById('windCanvas').getContext('2d'), createChartConfig('Wind Direction', 'rgba(255, 206, 86, 1)'));
  const windSpeedChart = new Chart(document.getElementById('windSpeedCanvas').getContext('2d'), createChartConfig('Wind Speed', 'rgba(75, 192, 192, 1)'));
  const rainChart = new Chart(document.getElementById('rainCanvas').getContext('2d'), createChartConfig('Rainfall', 'rgba(153, 102, 255, 1)'));
  const pressureChart = new Chart(document.getElementById('pressureCanvas').getContext('2d'), createChartConfig('Station Pressure', 'rgba(255, 159, 64, 1)'));

  // Function to update a chart with new data
  function updateChart(chart, newData) {
      chart.data.datasets[0].data.push(newData);
      chart.data.labels.push(new Date().toLocaleTimeString());
      if (chart.data.datasets[0].data.length > 20) {
          chart.data.datasets[0].data.shift();
          chart.data.labels.shift();
      }
      chart.update();
  }

  // Fetch weather data from OpenWeatherMap API
  async function fetchWeatherData() {
      try {
          const response = await fetch(apiUrl);
          const data = await response.json();
          return data;
      } catch (error) {
          console.error('Error fetching weather data:', error);
      }
  }

  // Update all charts with fetched data
  async function updateCharts() {
      const weatherData = await fetchWeatherData();

      if (weatherData) {
          // Extract relevant data from the API response
          const temperature = weatherData.main.temp;
          const humidity = weatherData.main.humidity;
          const windDirection = weatherData.wind.deg;
          const windSpeed = weatherData.wind.speed;
          const rainfall = weatherData.rain ? weatherData.rain["1h"] || 0 : 0; // Rainfall in the last hour (if available)
          const pressure = weatherData.main.pressure;

          // Update each chart with the new data
          updateChart(temperatureChart, temperature);
          updateChart(humidityChart, humidity);
          updateChart(windChart, windDirection);
          updateChart(windSpeedChart, windSpeed);
          updateChart(rainChart, rainfall);
          updateChart(pressureChart, pressure);
      } else {
          console.error("No weather data available.");
      }
  }

  // Automate data fetching and chart updates
  setInterval(updateCharts, 50000); // Fetch and update every 5 seconds

  // Initial call to display data immediately
  updateCharts();
});