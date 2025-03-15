import './App.css';

import React, { useState, useEffect } from 'react';

function App() {
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState(['Austin', 'Dallas', 'Houston']);
  const [error, setError] = useState('');
  const [cityCoordinates, setCityCoordinates] = useState({});

  const fetchWeatherForecast = async (latitude, longitude, timezone) => {
    try {
      setError('');

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&temperature_unit=fahrenheit&timezone=${timezone}`);
      const responseData = await response.json();
      
      const temperatures = responseData.hourly.temperature_2m;
      const cityUTCOffset = responseData.utc_offset_seconds / 60 / 60;
      const localUTCOffset = 5;
      const timezoneOffset = localUTCOffset + cityUTCOffset;

      const currentHour = new Date().getHours() + timezoneOffset;
      const forecastData = [];
      for (let i = currentHour; i < currentHour + 12; i++) {
        let ampm;
        if (i < 12 || i === 24) {
          ampm = 'AM';
        } else {
          ampm = 'PM';
        }

        let forecastHour;
        if (i === 12 || i === 24) {
          forecastHour = 12;
        } else {
          forecastHour = i % 12;
        }
        const forecastTemperature = Math.round(temperatures[i]);
        
        forecastData.push({
          time: `${forecastHour}:00${ampm}`,
          temperature: forecastTemperature
        });
      }

      setWeatherForecast(forecastData);

    } catch (err) {
      setError('Error fetching weather forecast.');
    }
  }

  const fetchCityCoordinates = async (city) => {
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
      const geocodingData = await response.json();

      const { latitude, longitude, timezone } = geocodingData.results[0];
      setCityCoordinates(prevState => ({
        ...prevState,
        [city]: { latitude, longitude, timezone }
      }));

      return { latitude, longitude, timezone };
    } catch (err) {
      setError(`Could not find weather for ${city}`);
    }
  }

  const handleCityButtonClick = async (city) => {
    if (cityCoordinates[city]) {
      const { latitude, longitude, timezone } = cityCoordinates[city];
      fetchWeatherForecast(latitude, longitude, timezone);
    } else {
      const coordinates = await fetchCityCoordinates(city);
      if (coordinates) {
        fetchWeatherForecast(coordinates.latitude, coordinates.longitude, coordinates.timezone);
      }
    }
  }

  const handleAddCityClick = async () => {
    const isCityInList = cities.some(city => city.toLowerCase() === cityInput.toLowerCase());

    if (cityInput && !isCityInList) {
      const coordinates = await fetchCityCoordinates(cityInput);
      if (coordinates) {
        setCities([...cities, cityInput]);
        setCityInput('');
        fetchWeatherForecast(coordinates.latitude, coordinates.longitude, coordinates.timezone);
      }
    } else {
      setError("City is already added!");
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      const coordinates = await fetchCityCoordinates('Austin');
      if (coordinates) {
        fetchWeatherForecast(coordinates.latitude, coordinates.longitude, coordinates.timezone);
      }
    };
    loadInitialData();
  }, []);
  

  return (
    <div>
      <div>
        {cities.map((city, index) => (
          <button key={index} onClick={() => handleCityButtonClick(city)}>
            {city}
          </button>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
        />
        <button onClick={handleAddCityClick}>+</button>
      </div>

      {error && <p>{error}</p>}

      {weatherForecast && (
        <div>
          <div>
            <div>
              <strong>Time</strong>
            </div>
            <div>
              <strong>Temperature</strong>
            </div>
          </div>

          <div>
            {weatherForecast.map((forecast, index) => (
              <div key={index}>
                <div>
                  {forecast.time}
                </div>
                <div>
                  {forecast.temperature} F
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;