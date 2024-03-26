// notes from work on monday, march 25th: 
  // created a front end elements object.
  // mapped over this object in the displayWeather function to:
    // 1. query select the elements by their id's
    // 2. display their inner text. 
  // hide loading animation function was being called in the get the weather function twice:
    // if the fetch was successful
    // if the fetch was unsuccesful
  // modified the get the weather function slightly to only call it once
  // fires after awaiting the geolocate user and get dates functions 


// possible next steps/brainstorm on how to make this better:
// 1. create:
  // - dailyDataPoints object
  // - currentDataPoints object
// 2. inside the weatherApp.getTheWeather function:
  // - map over the dailyDataPoints and CurrentDataPoints 
  // - doing this would make these url search params: 
    // "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "precipitation", "rain", "showers", "snowfall", "weather_code", "cloud_cover", "pressure_msl", "surface_pressure", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"],
    // "daily": ["weather_code", "apparent_temperature_max", "apparent_temperature_min", "precipitation_probability_mean", "sunrise", "sunset", "wind_speed_10m_max", "wind_speed_10m_min"]
  // look something like this: 
    // "current": Object.keys(weatherApp.currentDataPoints),
    // daily": Object.keys(weatherApp.dailyDataPoints)


const weatherApp = {};
const utilities = {};

weatherApp.weatherURL = 'https://api.open-meteo.com/v1/forecast';
weatherApp.geolocationURL = 'https://services.grassriots.io/';

utilities.hideJsDisabledMessage = function() {
  const jsDisabledMessage = document.querySelector('#js-disabled-message');
  jsDisabledMessage.classList.add('hidden');
}
utilities.showLoadingAnimation = function() {
  const loadingSpinner = document.querySelector('.lds-ring');
  if (loadingSpinner) {
    loadingSpinner.classList.remove('hidden');
  }
}
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
utilities.formatDate = function(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
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
weatherApp.getFrontEndElements = function(weatherData) {
  weatherApp.frontEndElementsObj = {
    "weatherContainer": {
      "id": "weatherContainer"
    },
    "location": {
      "id": "location",
      "innerText": `${weatherApp.city}` + ', ' + `${weatherApp.region}`
    },
    "date": {
      "id": "date",
      "innerText": utilities.formatDate(weatherApp.todaysDate)
    },
    "temperature": {
      "id": "temp",
      "innerText": weatherData.current.temperature_2m + weatherData.current_units.apparent_temperature
    },
    "apparentTemp": {
      "id": "app-temp",
      "innerText": weatherData.current.apparent_temperature + weatherData.current_units.apparent_temperature
    },
    "high": {
      "id": "high",
      "innerText": weatherData.daily.apparent_temperature_max[0] + weatherData.current_units.apparent_temperature
    },
    "low": {
      "id": "low",
      "innerText": weatherData.daily.apparent_temperature_min[0] + weatherData.current_units.apparent_temperature
    },
    "wind": {
      "id": "wind",
      "innerText": weatherData.daily.wind_speed_10m_max[0] + weatherData.daily_units.wind_speed_10m_max
    },
    "rain": {
      "id": "rain",
      "innerText": weatherData.daily.precipitation_probability_mean[0] + weatherData.daily_units.precipitation_probability_mean
    },
    "sunrise": {
      "id": "sunrise",
      "innerText": utilities.formatTime(weatherData.daily.sunrise[0])
    },
    "sunset": {
      "id": "sunset",
      "innerText": utilities.formatTime(weatherData.daily.sunset[0])
    }

  }
}

weatherApp.getTheWeather = async function() {
  try {
    await weatherApp.geolocateUser(); 
    await weatherApp.getDates();
    utilities.hideLoadingAnimation();

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

    weatherURLObj.search = weatherApp.searchParams.toString();

    const response = await fetch(weatherURLObj);
    if (!response.ok) {
      throw new Error('Network response from fetching weatherURLObj was not ok:' + response.statusText);
    }
    const jsonResponse = await response.json();
    if (!jsonResponse) {
      throw new Error('Invalid data received from weatherURLObj');
    } 
    // console.log('Weather data:', jsonResponse);
    setTimeout(() => {
      weatherApp.displayWeather(jsonResponse);
    }, 500);

  } catch (error) {
    // this code will execute should the network response fail or data be invalid. 
    console.error('Error fetching weather data:', error);
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

weatherApp.hideWeatherContainer = function() {
  weatherApp.weatherContainer.classList.add('hidden');

}

// display the weather! 
weatherApp.displayWeather = function(weatherData) {

  weatherApp.getFrontEndElements(weatherData);

  Object.keys(weatherApp.frontEndElementsObj).forEach(function(key) {
    const el = document.querySelector('#' + weatherApp.frontEndElementsObj[key].id);
    if (weatherApp.frontEndElementsObj[key].innerText) {
      el.innerText = weatherApp.frontEndElementsObj[key].innerText;
    } else if (weatherApp.frontEndElementsObj[key].id == 'weatherContainer') {
      el.classList.add('fade-in');
    }
  })
}

weatherApp.init = function() {
  utilities.hideJsDisabledMessage();
  weatherApp.getTheWeather();
}

weatherApp.init();