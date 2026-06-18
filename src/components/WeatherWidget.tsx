import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cloud, 
  Sun, 
  Moon, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudDrizzle, 
  CloudFog, 
  Thermometer, 
  Wind, 
  Droplets, 
  Search, 
  MapPin, 
  Loader2, 
  AlertCircle,
  X,
  Compass,
  RefreshCw
} from "lucide-react";

interface WeatherWidgetProps {
  appTheme: "cosmic" | "slate" | "vintage";
  onStormDetected?: (message: string, isStormActive: boolean) => void;
}

interface WeatherData {
  city: string;
  country?: string;
  temp: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  weatherCode: number;
}

export default function WeatherWidget({ appTheme, onStormDetected }: WeatherWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [searchCity, setSearchCity] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);

  // Initialize: Attempt geolocation first and refresh every 5 minutes automatically
  useEffect(() => {
    fetchWeatherByCoords();

    const telemetryInterval = setInterval(() => {
      fetchWeatherByCoords();
    }, 5 * 60 * 1000); // 5 minutes real-time refresh

    return () => clearInterval(telemetryInterval);
  }, []);

  const getWeatherIconAndLabel = (code: number, isDay: boolean) => {
    // Open-Meteo WMO weather codes mapping
    switch (code) {
      case 0:
        return {
          icon: isDay ? <Sun className="text-amber-400 animate-spin" style={{ animationDuration: "35s" }} size={24} /> : <Moon className="text-indigo-300" size={24} />,
          label: "Clear Sky"
        };
      case 1:
      case 2:
      case 3:
        return {
          icon: <Cloud className={isDay ? "text-sky-300" : "text-gray-400"} size={24} />,
          label: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast"
        };
      case 45:
      case 48:
        return {
          icon: <CloudFog className="text-slate-400" size={24} />,
          label: "Foggy"
        };
      case 51:
      case 53:
      case 55:
        return {
          icon: <CloudDrizzle className="text-cyan-400" size={24} />,
          label: "Drizzle"
        };
      case 61:
      case 63:
      case 65:
        return {
          icon: <CloudRain className="text-blue-400 animate-bounce" style={{ animationDuration: "2s" }} size={24} />,
          label: "Rainy"
        };
      case 71:
      case 73:
      case 75:
      case 77:
        return {
          icon: <CloudSnow className="text-blue-100 animate-pulse" size={24} />,
          label: "Snowfall"
        };
      case 80:
      case 81:
      case 82:
        return {
          icon: <CloudRain className="text-blue-400" size={24} />,
          label: "Showers"
        };
      case 95:
      case 96:
      case 99:
        return {
          icon: <CloudLightning className="text-yellow-400" size={24} />,
          label: "Thunderstorm"
        };
      default:
        return {
          icon: <Cloud className="text-slate-300" size={24} />,
          label: "Cloudy"
        };
    }
  };

  const fetchWeatherDetails = async (lat: number, lon: number, cityName: string, countryName?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed");
      
      const data = await res.json();
      const current = data.current;
      
      const weatherCode = current.weather_code;
      const windSpeed = current.wind_speed_10m;

      setWeather({
        city: cityName,
        country: countryName,
        temp: current.temperature_2m,
        apparentTemp: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: windSpeed,
        isDay: current.is_day === 1,
        weatherCode: weatherCode
      });

      // Real-time Storm / Rain Disaster detection logic
      const isSevereStorm = weatherCode === 95 || weatherCode === 96 || weatherCode === 99;
      const isHeavyRain = weatherCode === 65 || weatherCode === 82;
      const isHighWind = windSpeed >= 35;

      if ((isSevereStorm || isHeavyRain || isHighWind) && onStormDetected) {
        let alertMsg = "";
        if (isSevereStorm) {
          alertMsg = `সাবধান স্যার! ${cityName} এলাকায় বজ্রপাত সহ একটি তীব্র ঘূর্ণিঝড় ও মারাত্মক দুর্যোগ সৃষ্টি হয়েছে। দয়া করে নিরাপদ স্থানে আশু আশ্রয় নিন।`;
        } else if (isHeavyRain) {
          alertMsg = `স্যার, আপনার চলতি অবস্থানে (${cityName}) প্রবল বর্ষণ শুরু হয়েছে। রাস্তাঘাট পিচ্ছিল হতে পারে, সতর্ক থাকুন।`;
        } else {
          alertMsg = `সতর্কবার্তা স্যার! এলাকায় ঘণ্টায় ${windSpeed} কিলোমিটার বেগে অত্যন্ত তীব্র কালবৈশাখী হাওয়া বইছে।`;
        }
        onStormDetected(alertMsg, true);
      } else if (onStormDetected) {
        onStormDetected("", false);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to retrieve metrics.");
    } finally {
      setLoading(false);
    }
  };

  const formatTemp = (celsius: number) => {
    return `${Math.round(celsius)}°C`;
  };

  const fetchWeatherByCoords = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          let cityName = "Uluberia";
          let countryName = "India";
          
          // Try to reverse geocode name using free public bigdatacloud client API
          try {
            const geocodeUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
            const geoRes = await fetch(geocodeUrl);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              cityName = geoData.locality || geoData.city || geoData.principalSubdivision || "Uluberia";
              countryName = geoData.countryName || "India";
            }
          } catch (e) {
            console.warn("Reverse geocode failed, using default name 'Your Location'", e);
            cityName = "Your Location";
            countryName = undefined;
          }
          
          await fetchWeatherDetails(lat, lon, cityName, countryName);
        },
        (geoError) => {
          // If denied or unavailable, default to a major student city/station like Uluberia, West Bengal
          console.warn("Geolocation skipped/denied. Fetching default station...", geoError);
          fetchWeatherByCity("Uluberia");
        },
        { timeout: 10000 }
      );
    } else {
      fetchWeatherByCity("Uluberia");
    }
  };

  const fetchWeatherByCity = async (cityName: string) => {
    if (!cityName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      
      // Call public geocoding API
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName.trim())}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error("Geocoding service unavailable.");
      
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Station "${cityName}" not found.`);
      }
      
      const result = geoData.results[0];
      await fetchWeatherDetails(result.latitude, result.longitude, result.name, result.country);
      setShowSearch(false);
    } catch (err: any) {
      setError(err.message || "Search failed.");
      setLoading(false);
    }
  };

  const handleForceRefresh = () => {
    if (weather && weather.city && weather.city !== "Your Location") {
      fetchWeatherByCity(weather.city);
    } else {
      fetchWeatherByCoords();
    }
  };

  // Dynamic Theme Styling Matchers
  const themeClasses = {
    cosmic: {
      card: "bg-black/75 border-[#00f3ff]/20 text-[#cffafe] shadow-[0_0_15px_rgba(0,243,255,0.1)]",
      accentButton: "bg-[#00f3ff]/15 hover:bg-[#00f3ff]/30 text-[#00f3ff] border-[#00f3ff]/30",
      accentText: "text-[#00f3ff]",
      subText: "text-[#00f3ff]/60",
      input: "bg-[#091435]/80 border-[#00f3ff]/35 focus:border-[#00f3ff] focus:ring-[#00f3ff]/30 text-white",
      pill: "bg-[#00f3ff]/5 border-[#00f3ff]/20 text-[#00f3ff]"
    },
    slate: {
      card: "bg-slate-900/90 border-slate-700 text-slate-100 shadow-[0_4px_12px_rgba(15,23,42,0.15)]",
      accentButton: "bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border-blue-500/30",
      accentText: "text-blue-400",
      subText: "text-slate-400",
      input: "bg-slate-850 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-slate-100",
      pill: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    },
    vintage: {
      card: "bg-[#fcfbf9]/95 border-[#ac3b1d]/20 text-[#231f1c] shadow-[0_3px_10px_rgba(172,59,29,0.06)]",
      accentButton: "bg-[#ac3b1d]/10 hover:bg-[#ac3b1d]/15 text-[#ac3b1d] border-[#ac3b1d]/30",
      accentText: "text-[#ac3b1d]",
      subText: "text-[#65594f]",
      input: "bg-[#f5f1e6] border-[#ac3b1d]/30 focus:border-[#ac3b1d] focus:ring-[#ac3b1d]/15 text-[#231f1c]",
      pill: "bg-[#ac3b1d]/5 border-[#ac3b1d]/15 text-[#ac3b1d]"
    }
  };

  const style = themeClasses[appTheme] || themeClasses.cosmic;
  const weatherSpec = weather ? getWeatherIconAndLabel(weather.weatherCode, weather.isDay) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`w-full max-w-sm rounded-2xl border p-3.5 backdrop-blur-xl relative overflow-hidden transition-all duration-700 ${style.card}`}
    >
      {/* Background ambient light depending on custom weather properties */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-400/5 blur-2xl pointer-events-none" />

      <div className="flex flex-col gap-2.5">
        
        {/* Header section with location & tools */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={11.5} className={`${style.accentText} shrink-0 animate-pulse`} />
            <div className="text-left leading-tight truncate">
              {weather ? (
                <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase">
                  {weather.city}{weather.country ? `, ${weather.country}` : ""}
                </span>
              ) : (
                <span className="text-[9.5px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                  Searching grid...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Geolocation trigger */}
            <button
              onClick={fetchWeatherByCoords}
              disabled={loading}
              title="Locate via Geolocation"
              className="p-1 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
            >
              <Compass size={11} className={loading ? "animate-spin" : ""} />
            </button>

            {/* Manual Telemetry Refresh Core */}
            <button
              onClick={handleForceRefresh}
              disabled={loading}
              title="Refresh Weather Telemetry"
              className="p-1 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
            >
              <RefreshCw size={10.5} className={loading ? "animate-spin text-[#00f3ff]" : "hover:rotate-45 transition-transform duration-300"} />
            </button>

            {/* Toggle Search */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
            >
              {showSearch ? <X size={11} /> : <Search size={11} />}
            </button>
          </div>
        </div>

        {/* Inline Search Panel */}
        <AnimatePresence>
          {showSearch && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={(e) => {
                e.preventDefault();
                fetchWeatherByCity(searchCity);
              }}
              className="overflow-hidden flex gap-1.5 items-center w-full"
            >
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Enter city (e.g. London)"
                className={`flex-1 py-1 px-2.5 rounded-lg text-[9px] font-mono outline-none border transition-all ${style.input}`}
                autoFocus
              />
              <button
                type="submit"
                className={`py-1 px-2.5 rounded-lg text-[8.5px] font-bold font-mono uppercase tracking-wider border transition-all cursor-pointer ${style.accentButton}`}
              >
                Go
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Loading Spinner */}
        {loading && !weather && (
          <div className="flex flex-col items-center justify-center py-4 gap-1.5">
            <Loader2 size={16} className={`animate-spin ${style.accentText}`} />
            <span className="text-[8.5px] font-mono tracking-widest text-slate-400 uppercase">Synchronizing Telemetry...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-2 border border-red-500/20 bg-red-500/5 rounded-xl flex items-center gap-2">
            <AlertCircle size={12} className="text-red-400 shrink-0" />
            <span className="text-[8px] font-mono text-red-300 leading-snug">{error}</span>
          </div>
        )}

        {/* Core Weather Conditions Card representation */}
        {weather && !loading && (
          <div className="flex items-center justify-between gap-2.5 py-0.5">
            <div className="flex items-center gap-3">
              {/* Graphic Icon */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${style.pill}`}>
                {weatherSpec?.icon}
              </div>
              <div className="text-left">
                {/* Condition label */}
                <span className="text-[8.5px] font-mono uppercase tracking-widest font-black leading-none block text-slate-400">
                  {weatherSpec?.label}
                </span>
                {/* Real & Apparent Temperatures */}
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-bold font-mono tracking-tight leading-none text-white">
                    {formatTemp(weather.temp)}
                  </span>
                  <span className={`text-[8.5px] font-mono ${style.subText} uppercase leading-none`}>
                    feels {formatTemp(weather.apparentTemp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-parameters attributes */}
            <div className="flex flex-col items-end gap-1 font-mono text-[8px] tracking-wide text-right shrink-0">
              <div className="flex items-center gap-1">
                <Droplets size={9.5} className="text-cyan-400" />
                <span className="text-slate-300">Humidity: <b className="text-white font-medium">{weather.humidity}%</b></span>
              </div>
              <div className="flex items-center gap-1">
                <Wind size={9.5} className="text-sky-300" />
                <span className="text-slate-300">Wind: <b className="text-white font-medium">{weather.windSpeed} km/h</b></span>
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
