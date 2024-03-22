// define weatherApp object
const weatherApp = {};

// initialize URLs for weather and geolocation APIs
weatherApp.weatherURL = 'https://api.open-meteo.com/v1/forecast';
weatherApp.geolocationURL = 'https://services.grassriots.io/';

// initialize variables
weatherApp.todaysDate;
weatherApp.endDate;
weatherApp.lat;
weatherApp.long;
weatherApp.weatherContainer = document.querySelector('#weatherContainer');

// define search parameters for the weather API
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

// function to hide javascript disabled message and call on the geolocateUser function
weatherApp.hideJsDisabledMessage = function() {
  const jsDisabledMessage = document.querySelector('#js-disabled-message');
  const loadingSpinner = document.querySelector('.lds-ring');
  jsDisabledMessage.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');

  weatherApp.geolocateUser();
}

// function to fetch the users coordinates, city and region 
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
    // on success, save geolocation data into variables that we'll pass to the getTheWeather function.
    const isocode = data.data.isocode;
    const region = data.data.englishRegionName;
    const city = data.data.city;
    weatherApp.lat = data.data.lat;
    weatherApp.long = data.data.lng;
    const { todaysDate, endDate } = weatherApp.getDates();

    weatherApp.getTheWeather(region, city);
  } catch (error) {
    // this code will execute if there's a network response error or the json data returned is invalid
    console.error('Error fetching users coordinates:', error);
    weatherApp.hideWeatherContainer();
    weatherApp.displayErrorMessage();
  }
}

// function to get todays date and the date seven days after todays date. 
// i created this function for added 7-day forecast functionality later on. 
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

// this function is called in the displayWeather function to display the date in long date format.
// ie. Friday, March 22, 2024 (except we're not displaying the year here)
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// this function is called in the displayWeather function to display the time in the 12-hour clock format.
// ie. 3:04PM.
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

// this function is called on success of geolocating data retrieval in the geolocateUser function. 
// the geolocateUser passes information about the users region and city, which we'll subsequently pass to the displayTheWeather function that is called on success of weather data retrieval here.
weatherApp.getTheWeather = async function(region, city) {
  try {
    weatherApp.showLoadingAnimation();
    const urlObj = new URL(weatherApp.weatherURL);
    // defining our new search parameters that we'll add onto our base URL
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
    // if the network response is not ok, throw an error
    if (!response.ok) {
      throw new Error('Network response from fetching urlObj was not ok:' + response.statusText);
    }
    // if the network response is ok, parse the response as a json object
    const data = await response.json();
    // if the data is invalid, throw an error. 
    if (!data) {
      throw new Error('Invalid data received from urlObj');
    } 
    // if everything is successful, hide the loading animation 
    // console log our response. 
    weatherApp.hideLoadingAnimation(); 
    console.log('Weather data:', data);

    // this set timeout will fade the weather smoothly once the loading spinner is done fading out.
    setTimeout(() => {
      weatherApp.displayWeather(data, city, region);
    }, 500);

  } catch (error) {
    // this code will execute should the network response fail or data be invalid. 
    console.error('Error fetching weather data:', error);
    weatherApp.hideLoadingAnimation(); 
    weatherApp.hideWeatherContainer();
    weatherApp.displayErrorMessage();
  }
}

// this is called in the getTheWeather function to show a loading animation while we fetch the data.
weatherApp.showLoadingAnimation = function() {
  const loadingSpinner = document.querySelector('.lds-ring');
  if (loadingSpinner) {
    loadingSpinner.style.display = 'block';
  }
}

// whether data retrieval is successful or not, we need to hide the animation and either display weather info or that an error has occurred. 
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

// dynamically populate the error message fields. 
// as the code is right now, this doesn't have to be dynamically inserted. 
// i've dynamically inserted it here as i'd like to add some condition that presents a different error depending on whether this was an error while fetching their coordinates or while fetching the weather. the geolocation error would come first as the function is called first.
weatherApp.displayErrorMessage = function () {
  const h1El = document.querySelector('#errorContainer h1');
  const errorPEl = document.querySelector('#errorContainer p');

  if (h1El) h1El.innerText = 'Error';
  if (errorPEl) errorPEl.innerText = "Something went wrong and we're unable to get weather data right now. Please try again later."
}

// very small, simple function to add a class of hidden to the weather container should we call the error message function.
weatherApp.hideWeatherContainer = function() {
  weatherApp.weatherContainer.classList.add('hidden');

}

// display the weather! 
// save all of our html elements into variables and then display the data we've gotten back from our successful calls to the geolocatgion api and the weather api! 
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

// the very first function called in this document.
// this kicks off everything by checking whether the user has their javascript disabled, 
// if they do, we display a message to let them know this app won't run unless they enable it. 
weatherApp.init = function() {
  weatherApp.hideJsDisabledMessage();
}

weatherApp.init();