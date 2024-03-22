const weatherApp = {};
weatherApp.weatherURL = 'https://api.open-meteo.com/v1/forecast';
weatherApp.geolocationURL = 'https://services.grassriots.io/';

weatherApp.todaysDate = null;
weatherApp.endDate = null;
weatherApp.lat = null;
weatherApp.long = null;
weatherApp.weatherContainer = document.querySelector('#weatherContainer');

weatherApp.searchParams = new URLSearchParams({
  "latitude": weatherApp.lat,
  "longitude": weatherApp.long,
  "temperature_unit": "celsius",
  "wind_speed_unit": "mph",
  "precipitation_unit": "mm",
  "start_date": weatherApp.todaysDate,
  "end_date": weatherApp.endDate,
  "timezone": "auto",
  "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "precipitation", "rain", "showers", "snowfall", "weather_code", "cloud_cover", "pressure_msl", "surface_pressure", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"],
  "hourly": "temperature_2m",
  "daily": ["weather_code", "apparent_temperature_max", "apparent_temperature_min", "precipitation_probability_mean", "sunrise", "sunset", "wind_speed_10m_max", "wind_speed_10m_min"]
})

weatherApp.hideJsDisabledMessage = function() {
  const jsDisabledMessage = document.querySelector('#js-disabled-message');
  const loadingSpinner = document.querySelector('.lds-ring');
  jsDisabledMessage.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');

  weatherApp.geolocateUser();
}

weatherApp.geolocateUser = async function() {
  try {
    const response = await fetch(weatherApp.geolocationURL);
    if (!response.ok) {
      throw new Error('Network response from fetching geolocationURL was not ok:' + response.statusText);
    }

    const data = await response.json();
    if (!data.data || !data.data.lat || !data.data.lng) {
      throw new Error('Invalid data received from geolocationURL');
    } 
    const isocode = data.data.isocode;
    const region = data.data.englishRegionName;
    const city = data.data.city;
    weatherApp.lat = data.data.lat;
    weatherApp.long = data.data.lng;
    const { todaysDate, endDate } = weatherApp.getDates();

    weatherApp.getTheWeather(weatherApp.lat, weatherApp.long, todaysDate, endDate, isocode, region, city);
  } catch (error) {
    console.error('Error fetching users coordinates:', error);
    weatherApp.hideWeatherContainer();
    weatherApp.displayErrorMessage();
  }
}

weatherApp.getDates = function() {
  let today = new Date();
  let d = String(today.getDate()).padStart(2, '0');
  let m = String(today.getMonth() + 1).padStart(2, '0');
  let y = today.getFullYear();
  weatherApp.todaysDate = y + '-' + m + '-' + d;

  let endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  d = String(endDate.getDate()).padStart(2, '0');
  m = String(endDate.getMonth() + 1).padStart(2, '0');
  y = endDate.getFullYear();
  weatherApp.endDate = y + '-' + m + '-' + d;

  return { todaysDate: weatherApp.todaysDate, endDate: weatherApp.endDate };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    const date = new Date(timeString);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let meridiem = hours >= 12 ? 'PM' : 'AM';

    // convert hours to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return hours + ':' + formattedMinutes + meridiem;
}

weatherApp.getTheWeather = async function(lat, long, todaysDate, endDate, isocode, region, city) {
  try {
    weatherApp.showLoadingAnimation();
    const urlObj = new URL(weatherApp.weatherURL);
    const searchParams = new URLSearchParams({
      "latitude": weatherApp.lat,
      "longitude": weatherApp.long,
      "temperature_unit": "celsius",
      "wind_speed_unit": "mph",
      "precipitation_unit": "mm",
      "start_date": weatherApp.todaysDate,
      "end_date": weatherApp.endDate,
      "timezone": "auto",
      "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "precipitation", "rain", "showers", "snowfall", "weather_code", "cloud_cover", "pressure_msl", "surface_pressure", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"],
      "hourly": "temperature_2m",
      "daily": ["weather_code", "apparent_temperature_max", "apparent_temperature_min", "precipitation_probability_mean", "sunrise", "sunset", "wind_speed_10m_max", "wind_speed_10m_min"]
    })

    urlObj.search = searchParams.toString();

    const response = await fetch(urlObj);
    if (!response.ok) {
      throw new Error('Network response from fetching newWeatherURL was not ok:' + response.statusText);
    }

    const data = await response.json();
    if (!data) {
      throw new Error('Invalid data received from newWeatherURL');
    } 
    weatherApp.hideLoadingAnimation(); 
    console.log('Weather data:', data);

    setTimeout(() => {
      weatherApp.displayWeather(data, city, region);
    }, 500);

  } catch (error) {
    console.error('Error fetching weather data:', error);
    weatherApp.hideLoadingAnimation(); 
    weatherApp.hideWeatherContainer();
    weatherApp.displayErrorMessage();
  }
}

weatherApp.showLoadingAnimation = function() {
  const loadingSpinner = document.querySelector('.lds-ring');
  if (loadingSpinner) {
    loadingSpinner.style.display = 'block';
  }
}

weatherApp.hideLoadingAnimation = function() {
  const loadingSpinner = document.querySelector('.lds-ring');

  if (loadingSpinner) {
    loadingSpinner.style.transition = 'opacity 0.5s ease';
    loadingSpinner.style.opacity = '0';

    // hide the spinner after the animation ends
    setTimeout(() => {
      loadingSpinner.style.display = 'none';
    }, 500);
  }
}

weatherApp.displayErrorMessage = function () {
  const h1El = document.querySelector('#errorContainer h1');
  const errorPEl = document.querySelector('#errorContainer p');

  if (h1El) h1El.innerText = 'Error';
  if (errorPEl) errorPEl.innerText = "Something went wrong and we're unable to get weather data right now. Please try again later."
}

weatherApp.hideWeatherContainer = function() {
  weatherApp.weatherContainer.classList.add('hidden');

}

weatherApp.displayWeather = function(data, city, region) {
  if (weatherApp.weatherContainer) {
    weatherApp.weatherContainer.classList.add('fade-in');
  }

  const h1El = document.querySelector('#weatherContainer h1');
  const timeEl = document.querySelector('time');
  const temperatureEl = document.querySelector('#temp');
  const apparentTempEl = document.querySelector('#app-temp');
  const highEl = document.querySelector('#high');
  const windEl = document.querySelector('#wind');
  const sunriseEl = document.querySelector('#sunrise');
  const lowEl = document.querySelector('#low');
  const rainEl = document.querySelector('#rain');
  const sunsetEl = document.querySelector('#sunset');

  let formattedDateData = formatDate(weatherApp.todaysDate);
  let formattedSunriseTime = formatTime(data.daily.sunrise[0]);
  let formattedSunsetTime = formatTime(data.daily.sunset[0]);
  let tempData = data.current.temperature_2m;
  let appTempData = data.current.apparent_temperature;
  let tempDataUnit = data.current_units.apparent_temperature;
  let windCurrentData = data.current.wind_speed_10m;
  let tempMaxData = data.daily.apparent_temperature_max[0];
  let tempLowData = data.daily.apparent_temperature_min[0];
  let windDailyData = data.daily.wind_speed_10m_max[0];
  let windDailyDataUnit = data.daily_units.wind_speed_10m_max;
  let rainData = data.daily.precipitation_probability_mean[0];
  let rainDataUnits = data.daily_units.precipitation_probability_mean;


  if (h1El) h1El.innerText = `${city}, ${region}`;
  if (timeEl) {
    timeEl.innerText = `${formattedDateData}`;
    timeEl.setAttribute('datetime', weatherApp.todaysDate);
  }
  if (apparentTempEl) apparentTempEl.innerText = `${appTempData}${tempDataUnit}`;
  if (temperatureEl) temperatureEl.innerText = `${tempData}${tempDataUnit}`;
  if (highEl) highEl.innerText = `${tempMaxData}${tempDataUnit}`;
  if (windEl) windEl.innerText = `${windCurrentData}` + ' ' + `${windDailyDataUnit}`;
  if (sunriseEl) sunriseEl.innerText = `${formattedSunriseTime}`;
  if (lowEl) lowEl.innerText = `${tempLowData}${tempDataUnit}`;
  if (rainEl) rainEl.innerText = `${rainData}${rainDataUnits}`;
  if (sunsetEl) sunsetEl.innerText = `${formattedSunsetTime}`;
}

weatherApp.init = function() {
  weatherApp.hideJsDisabledMessage();
  // weatherApp.geolocateUser();
}

weatherApp.init();