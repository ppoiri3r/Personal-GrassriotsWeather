// NOTE TO SELF march 24
// next steps here are to pass city and region to the displayWeather function. 
// coordinates and dates are being passed correctly to the search params in getTheWeather function 

// define weatherApp object
const weatherApp = {};
// define utilities object.
// this object will house utility functions/helper functions. 
const utilities = {};

weatherApp.weatherURL = 'https://api.open-meteo.com/v1/forecast';
weatherApp.geolocationURL = 'https://services.grassriots.io/';
weatherApp.weatherContainer = document.querySelector('#weatherContainer');

// function to hide javascript disabled message
utilities.hideJsDisabledMessage = function() {
  const jsDisabledMessage = document.querySelector('#js-disabled-message');
  jsDisabledMessage.classList.add('hidden');
}

// this is called in the getTheWeather function to show a loading animation while we fetch the data.
utilities.showLoadingAnimation = function() {
  const loadingSpinner = document.querySelector('.lds-ring');
  if (loadingSpinner) {
    loadingSpinner.classList.remove('hidden');
  }
}

// whether data retrieval is successful or not, we need to hide the animation and either display weather info or that an error has occurred. 
utilities.hideLoadingAnimation = function() {
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

// this function is called in the displayWeather function to display the date in long date format.
// ie. Friday, March 22, 2024 (except we're not displaying the year here)
utilities.formatDate = function(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// this function is called in the displayWeather function to display the time in the 12-hour clock format.
// ie. 3:04PM.
utilities.formatTime = function(timeString) {
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

// function to fetch the users coordinates, city and region 
weatherApp.geolocateUser = async function() {
  utilities.showLoadingAnimation();
  try {
    const response = await fetch(weatherApp.geolocationURL);
    if (!response.ok) {
      throw new Error('Network response from fetching geolocationURL was not ok:' + response.statusText);
    }
    const jsonResponse = await response.json();
    if (!jsonResponse.data || !jsonResponse.data.lat || !jsonResponse.data.lng) {
      throw new Error('Invalid data received from geolocationURL');
    } 
    // on success, save geolocation data into variables that we'll pass to the getTheWeather function.
    weatherApp.lat = jsonResponse.data.lat;
    weatherApp.long = jsonResponse.data.lng;
    weatherApp.city = jsonResponse.data.city;
    weatherApp.region = jsonResponse.data.englishRegionName;
    weatherApp.isocode = jsonResponse.data.isocode;
  } catch (error) {
    // this code will execute if there's a network response error or the json data returned is invalid
    console.error('Error fetching users coordinates in geolocateUser function:', error);
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
  // should we want to getch more than the 7 days forecast, we only need to change the "+ 7" in this line of code to + [desired number]. 
  // we can fetch up to a 16 day forecast with this particular weather api. 
  endDate.setDate(endDate.getDate() + 7);
  d = String(endDate.getDate()).padStart(2, '0');
  m = String(endDate.getMonth() + 1).padStart(2, '0');
  y = endDate.getFullYear();
  weatherApp.endDate = y + '-' + m + '-' + d;
}

// this function is called on success of geolocating data retrieval in the geolocateUser function. 
// the geolocateUser passes information about the users region and city, which we'll subsequently pass to the displayTheWeather function that is called on success of weather data retrieval here.
weatherApp.getTheWeather = async function() {
  try {
    await weatherApp.geolocateUser(); 
    await weatherApp.getDates();

    const weatherURLObj = new URL(weatherApp.weatherURL);
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

    console.log('weatherURLObj:', weatherURLObj);
    weatherURLObj.search = weatherApp.searchParams.toString();

    const response = await fetch(weatherURLObj);
    // if the network response is not ok, throw an error
    if (!response.ok) {
      throw new Error('Network response from fetching weatherURLObj was not ok:' + response.statusText);
    }
    // if the network response is ok, parse the response as a json object
    const jsonResponse = await response.json();
    // if the data is invalid, throw an error. 
    if (!jsonResponse) {
      throw new Error('Invalid data received from urlObj');
    } 
    // if everything is successful, hide the loading animation 
    // console log our response. 
    console.log('Weather data:', jsonResponse);
    utilities.hideLoadingAnimation(); 

    // this set timeout will fade the weather smoothly once the loading spinner is done fading out.
    setTimeout(() => {
      weatherApp.displayWeather(jsonResponse);
    }, 500);

  } catch (error) {
    // this code will execute should the network response fail or data be invalid. 
    console.error('Error fetching weather data:', error);
    utilities.hideLoadingAnimation(); 
    weatherApp.hideWeatherContainer();
    weatherApp.displayErrorMessage();
  }
}

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

  let formattedDateData = utilities.formatDate(weatherApp.todaysDate);
  let formattedSunriseTime = utilities.formatTime(data.daily.sunrise[0]);
  let formattedSunsetTime = utilities.formatTime(data.daily.sunset[0]);
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
  utilities.hideJsDisabledMessage();
  weatherApp.getTheWeather();
}

weatherApp.init();