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
  Wind, 
  Search, 
  MapPin, 
  Loader2, 
  AlertCircle,
  X,
  Compass,
  RefreshCw
} from "lucide-react";

interface WeatherWidgetProps {
  
  onStormDetected?: (message: string, isStormActive: boolean) => void;
}

interface HourlyForecast {
  time: string;
  temp: number;
  weatherCode: number;
  isDay: boolean;
  humidity?: number;
  windSpeed?: number;
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
  hourly: HourlyForecast[];
}

export default function WeatherWidget({ onStormDetected }: WeatherWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [searchCity, setSearchCity] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Initialize: Attempt geolocation first and refresh every 5 minutes automatically
  useEffect(() => {
    fetchWeatherByCoords();

    const telemetryInterval = setInterval(() => {
      fetchWeatherByCoords();
    }, 5 * 60 * 1000); // 5 minutes real-time refresh

    return () => clearInterval(telemetryInterval);
  }, []);

  // Reset active index to "Now" whenever a different city loads
  useEffect(() => {
    setActiveIndex(0);
  }, [weather?.city]);

  const getWeatherIconAndLabel = (code: number, isDay: boolean) => {
    // Open-Meteo WMO weather codes mapping
    switch (code) {
      case 0:
        return {
          icon: isDay ? <Sun className="text-amber-400 animate-spin" style={{ animationDuration: "35s" }} size={24} /> : <Moon className="text-indigo-300" size={24} />,
          label: "Clear"
        };
      case 1:
      case 2:
      case 3:
        return {
          icon: <Cloud className={isDay ? "text-sky-300" : "text-gray-400"} size={24} />,
          label: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Cloudy"
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
          label: "Snowy"
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

  const getCustomWeatherIcon = (code: number, isDay: boolean, size: number = 24) => {
    switch (code) {
      case 0: // Clear sky
        return isDay ? (
          <div className="relative flex items-center justify-center">
            <Sun className="text-amber-400 fill-amber-300/10 animate-[spin_40s_linear_infinite]" size={size} />
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <Moon className="text-amber-200 fill-amber-100/10" size={size} />
          </div>
        );
      case 1:
      case 2:
      case 3: // Cloudy / Partly Cloudy / Overcast
        return isDay ? (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Sun className="text-amber-400/80 absolute -top-1 -right-1" size={size * 0.7} />
            <Cloud className="text-white fill-white absolute bottom-0.5 left-0.5" size={size * 0.95} />
          </div>
        ) : (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Moon className="text-amber-200 absolute -top-1 -right-1" size={size * 0.65} />
            <Cloud className="text-slate-200 fill-slate-100 absolute bottom-0.5 left-0.5" size={size * 0.95} />
          </div>
        );
      case 45:
      case 48: // Foggy
        return (
          <div className="relative flex items-center justify-center">
            <CloudFog className="text-slate-300" size={size} />
          </div>
        );
      case 51:
      case 53:
      case 55: // Drizzle
      case 61:
      case 63:
      case 65: // Rain
      case 80:
      case 81:
      case 82: // Showers
        return isDay ? (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Sun className="text-[#fca5a5]/40 absolute -top-1 -right-1" size={size * 0.7} />
            <CloudRain className="text-blue-305 absolute bottom-0.5 left-0.5" size={size} />
          </div>
        ) : (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Moon className="text-indigo-400/30 absolute -top-1 -right-1" size={size * 0.7} />
            <CloudRain className="text-blue-300 absolute bottom-0.5 left-0.5" size={size} />
          </div>
        );
      case 95:
      case 96:
      case 99: // Thunderstorm
        return (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <CloudLightning className="text-yellow-400 absolute bottom-0.5 left-0.5" size={size} />
          </div>
        );
      default:
        return (
          <div className="relative flex items-center justify-center">
            <Cloud className="text-slate-200 fill-white" size={size} />
          </div>
        );
    }
  };

  const fetchWeatherDetails = async (lat: number, lon: number, cityName: string, countryName?: string) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch current weather AND hourly forecast for 24-hours
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather database request failed");
      
      const data = await res.json();
      const current = data.current;
      
      const weatherCode = current.weather_code;
      const windSpeed = current.wind_speed_10m;

      // Filter and align the hourly forecast to starting from closest local hour
      let hourlyList: HourlyForecast[] = [];
      const nowTime = Date.now();
      
      if (data.hourly && data.hourly.time && data.hourly.time.length > 0) {
        let startIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < data.hourly.time.length; i++) {
          const t = new Date(data.hourly.time[i]).getTime();
          const diff = Math.abs(t - nowTime);
          if (diff < minDiff) {
            minDiff = diff;
            startIndex = i;
          }
        }
        
        // Take 12 consecutive hours for compact horizontal scrolling profile
        for (let i = startIndex; i < startIndex + 12 && i < data.hourly.time.length; i++) {
          hourlyList.push({
            time: data.hourly.time[i],
            temp: data.hourly.temperature_2m[i],
            weatherCode: data.hourly.weather_code[i],
            isDay: data.hourly.is_day[i] === 1,
            humidity: data.hourly.relative_humidity_2m ? data.hourly.relative_humidity_2m[i] : undefined,
            windSpeed: data.hourly.wind_speed_10m ? data.hourly.wind_speed_10m[i] : undefined
          });
        }
      }

      // Safe fallback data if hourly results somehow come up empty
      if (hourlyList.length === 0) {
        const baseTemp = current.temperature_2m;
        for (let i = 0; i < 12; i++) {
          const projectedHour = new Date(nowTime + i * 3600000);
          const hourStr = projectedHour.toISOString();
          const pIsDay = projectedHour.getHours() > 5 && projectedHour.getHours() < 18;
          hourlyList.push({
            time: hourStr,
            temp: baseTemp + Math.sin(i / 1.5) * 1.8,
            weatherCode: weatherCode,
            isDay: pIsDay,
            humidity: Math.round(current.relative_humidity_2m + Math.sin(i / 2) * 5),
            windSpeed: Math.round(windSpeed + Math.cos(i / 2) * 3)
          });
        }
      }

      setWeather({
        city: cityName,
        country: countryName,
        temp: current.temperature_2m,
        apparentTemp: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: windSpeed,
        isDay: current.is_day === 1,
        weatherCode: weatherCode,
        hourly: hourlyList
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
      setError("Failed to retrieve real-time metrics.");
    } finally {
      setLoading(false);
    }
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
          
          try {
            const geocodeUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
            const geoRes = await fetch(geocodeUrl);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              cityName = geoData.locality || geoData.city || geoData.principalSubdivision || "Uluberia";
              countryName = geoData.countryName || "India";
            }
          } catch (e) {
            console.warn("Reverse geocode search failed, running standard defaults...", e);
            cityName = "Uluberia";
            countryName = "India";
          }
          
          await fetchWeatherDetails(lat, lon, cityName, countryName);
        },
        (geoError) => {
          console.warn("Geolocation skipped/denied. Syncing standard telemetry...", geoError);
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

  const formatHour = (isoStr: string, isFirst: boolean) => {
    if (isFirst) return "Now";
    const date = new Date(isoStr);
    const hours = date.getHours();
    return `${hours.toString().padStart(2, "0")}:00`;
  };

  // State resolution for rendering active hour selected details
  const activeHour = weather?.hourly && weather.hourly[activeIndex] ? weather.hourly[activeIndex] : null;
  const currentTemp = activeHour ? activeHour.temp : (weather?.temp || 0);
  const currentWeatherCode = activeHour ? activeHour.weatherCode : (weather?.weatherCode || 0);
  const currentIsDay = activeHour ? activeHour.isDay : (weather?.isDay ?? true);
  const currentHumidity = activeHour && activeHour.humidity !== undefined ? activeHour.humidity : (weather?.humidity ?? 0);
  const currentWindSpeed = activeHour && activeHour.windSpeed !== undefined ? activeHour.windSpeed : (weather?.windSpeed ?? 0);

  const weatherSpec = weather ? getWeatherIconAndLabel(currentWeatherCode, currentIsDay) : null;

  // Weather status triggers for overlays
  const isRainy = weather && (
    currentWeatherCode === 51 || currentWeatherCode === 53 || currentWeatherCode === 55 ||
    currentWeatherCode === 61 || currentWeatherCode === 63 || currentWeatherCode === 65 ||
    currentWeatherCode === 80 || currentWeatherCode === 81 || currentWeatherCode === 82 ||
    currentWeatherCode === 95 || currentWeatherCode === 96 || currentWeatherCode === 99
  );

  // Background style decider matching screenshot details perfectly
  const getBackgroundStyle = () => {
    if (!weather) return "bg-[#0c1328] border-slate-800 text-white min-h-[220px]";
    
    if (isRainy) {
      // Rainy background style: gloomy midnight rainy gray-blue
      return "bg-[#111928] border-white/5 text-white";
    } else if (!currentIsDay) {
      // Starry night backdrop: gorgeous deep space midnight sky
      return "bg-[#0b142c] border-white/5 text-slate-100";
    } else {
      // Light cloudy morning / daytime backdrop: bright, warm and cloudy sky
      return "bg-[#1e40af] border-white/10 text-white";
    }
  };

  // Points calculation helper for bezier SVG rendering
  const getGraphPoints = () => {
    if (!weather || !weather.hourly || weather.hourly.length === 0) return { points: [], pathD: "" };
    
    const temps = weather.hourly.map(h => h.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp || 1;
    
    // Scale points to fit beautiful SVG viewport height (~45px) with vertical pad
    const points = weather.hourly.map((hour, i) => {
      const cx = i * 56 + 28;
      const cy = 35 - ((hour.temp - minTemp) / tempRange) * 22;
      return { x: cx, y: cy };
    });
    
    let pathD = "";
    if (points.length > 0) {
      pathD += `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + 28;
        const cpY1 = p0.y;
        const cpX2 = p0.x + 28;
        const cpY2 = p1.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
    }
    
    return { points, pathD };
  };

  const { points, pathD } = getGraphPoints();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`w-full max-w-sm rounded-[28px] border p-5 backdrop-blur-2xl relative overflow-hidden transition-all duration-750 select-none pb-4 ${getBackgroundStyle()}`}
    >
      <style>{`
        @keyframes rain-fall {
          0% { transform: translateY(-40px) rotate(12deg); opacity: 0; }
          5% { opacity: 0.65; }
          90% { opacity: 0.65; }
          100% { transform: translateY(180px) rotate(12deg); opacity: 0; }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes cloud-shift {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(12px); }
        }
        .scroller-none::-webkit-scrollbar {
          display: none;
        }
        .scroller-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Background Overlays */}
      {isRainy && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[28px]">
          {[...Array(16)].map((_, i) => {
            const left = `${(i * 100) / 16 + Math.random() * 4}%`;
            const delay = `${Math.random() * 1.5}s`;
            const duration = `${0.65 + Math.random() * 0.35}s`;
            const height = `${12 + Math.random() * 10}px`;
            return (
              <div
                key={i}
                className="absolute w-[1.2px] bg-blue-300/40 rounded"
                style={{
                  left,
                  top: "-20px",
                  height,
                  animation: `rain-fall ${duration} linear ${delay} infinite`,
                }}
              />
            );
          })}
        </div>
      )}

      {!isRainy && !currentIsDay && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[28px]">
          {[...Array(18)].map((_, i) => {
            const left = `${Math.random() * 100}%`;
            const top = `${Math.random() * 65}%`;
            const size = `${1 + Math.random() * 1.5}px`;
            const delay = `${Math.random() * 3}s`;
            return (
              <div
                key={i}
                className="absolute bg-white rounded-full bg-opacity-70"
                style={{
                  left,
                  top,
                  width: size,
                  height: size,
                  animation: `star-twinkle ${2 + Math.random() * 2}s ease-in-out ${delay} infinite`,
                }}
              />
            );
          })}
        </div>
      )}

      {!isRainy && currentIsDay && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[28px] opacity-20">
          <div 
            className="absolute top-4 -left-10 w-32 h-12 bg-white/45 blur-lg rounded-full"
            style={{ animation: "cloud-shift 12s ease-in-out infinite" }}
          />
          <div 
            className="absolute top-12 -right-8 w-40 h-14 bg-white/35 blur-xl rounded-full"
            style={{ animation: "cloud-shift 15s ease-in-out infinite reverse" }}
          />
        </div>
      )}

      <div className="flex flex-col gap-1 w-full h-full justify-between">
        
        {/* Compact utility controls bar */}
        <div className="flex items-center justify-between gap-1 text-white/50 hover:text-white/85 transition-colors z-10 relative">
          <div className="flex items-center gap-1">
            <MapPin size={9} className="animate-pulse text-amber-400" />
            <span className="text-[8px] font-mono tracking-widest uppercase font-semibold">REAL-TIME WEATHER STATION</span>
          </div>
          
          <div className="flex items-center gap-2 bg-black/15 hover:bg-black/35 px-2 py-0.5 rounded-full border border-white/5 transition-all">
            <button 
              type="button" 
              onClick={fetchWeatherByCoords} 
              disabled={loading} 
              className="hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer"
              title="GPS Resolve"
            >
              <Compass size={10} className={loading ? "animate-spin text-amber-300" : ""} />
            </button>
            
            <button 
              type="button" 
              onClick={handleForceRefresh} 
              disabled={loading} 
              className="hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer"
              title="Sync Server"
            >
              <RefreshCw size={10} className={loading ? "animate-spin text-amber-300" : ""} />
            </button>

            <button 
              type="button" 
              onClick={() => setShowSearch(!showSearch)} 
              className="hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer"
              title="Search Station"
            >
              {showSearch ? <X size={10} /> : <Search size={10} />}
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.form
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 12 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={(e) => {
                e.preventDefault();
                fetchWeatherByCity(searchCity);
              }}
              className="overflow-hidden flex gap-1.5 items-center w-full z-20 relative mt-1"
            >
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Enter station (e.g. London)..."
                className="flex-1 py-1 px-3 rounded-xl text-[10px] font-sans outline-none bg-black/40 border border-white/10 text-white focus:border-white/30 transition-all"
                autoFocus
              />
              <button
                type="submit"
                className="py-1 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-white/15 hover:bg-white/25 border border-white/10 text-white transition-all cursor-pointer"
              >
                Go
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Loading overlay panel */}
        {loading && !weather && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 size={18} className="animate-spin text-white/50" />
            <span className="text-[8.5px] font-mono tracking-widest text-white/40 uppercase">Connecting Open-Meteo DB...</span>
          </div>
        )}

        {/* Error Alerts */}
        {error && (
          <div className="p-2 w-full mt-1.5 border border-red-500/20 bg-red-900/10 rounded-xl flex items-center gap-2">
            <AlertCircle size={12} className="text-red-400 shrink-0" />
            <span className="text-[8.5px] font-mono text-red-300 leading-snug">{error}</span>
          </div>
        )}

        {/* Primary readout display with subtle cross-fade */}
        <AnimatePresence mode="wait">
          {weather && !loading && (
            <motion.div
              key={`${weather.city}-${activeIndex}`}
              initial={{ opacity: 0, y: 3, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -3, filter: "blur(2px)" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex justify-between items-start z-10 relative mt-2 w-full"
            >
              {/* Left side: Large Temperature readout */}
              <div className="flex items-start">
                <span className="text-[64px] font-light font-sans tracking-tight text-white leading-none">
                  {Math.round(currentTemp)}
                </span>
                <span className="text-xl font-light text-white/85 font-sans ml-1 mt-1 select-none">
                  °C
                </span>
              </div>

              {/* Right side: Station name and current condition */}
              <div className="text-right flex flex-col justify-start">
                <span className="text-sm font-sans font-semibold tracking-wide text-white leading-tight">
                  {weather.city}
                </span>
                <span className="text-xs font-sans text-white/75 leading-snug mt-0.5">
                  {weatherSpec?.label || "Cloudy"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modern Live Telemetry Metrics displaying Radial Humidity Gauge */}
        {weather && !loading && (
          <div className="grid grid-cols-2 gap-2 mt-3 z-10 relative">
            
            {/* Humidity Radial Gauge Card */}
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 backdrop-blur-md rounded-[20px] p-2 hover:bg-white/10 transition-all duration-300">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                {/* SVG Radial Arc */}
                <svg className="w-12 h-12 transform -rotate-90">
                  {/* Track Circle */}
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    className="stroke-white/10 fill-none"
                    strokeWidth="3.5"
                  />
                  {/* Animated Progress Circle */}
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="19"
                    className="stroke-cyan-400 fill-none"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    initial={false}
                    animate={{ strokeDashoffset: (2 * Math.PI * 19) - (currentHumidity / 100) * (2 * Math.PI * 19) }}
                    transition={{ type: "spring", stiffness: 60, damping: 14 }}
                    style={{
                      strokeDasharray: 2 * Math.PI * 19,
                    }}
                  />
                </svg>
                
                {/* Embedded Value indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentHumidity}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] font-bold font-mono tracking-tighter text-cyan-200"
                    >
                      {Math.round(currentHumidity)}%
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-[8.5px] font-mono tracking-wider font-bold text-white/50 uppercase leading-none mb-1">Humidity</span>
                <div className="h-[12px] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentHumidity}
                      initial={{ opacity: 0, x: -3 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 3 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] font-sans font-medium text-slate-200 truncate leading-none block"
                    >
                      {currentHumidity < 40 ? "Dry Air" : currentHumidity <= 60 ? "Comfortable" : currentHumidity <= 80 ? "Humid" : "Sticky"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Wind Telemetry Interactive Card */}
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 backdrop-blur-md rounded-[20px] p-2 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-400/15 flex items-center justify-center shrink-0">
                <Wind 
                  size={18} 
                  className={`text-indigo-300 transition-transform ${currentWindSpeed > 20 ? 'animate-[spin_4s_linear_infinite]' : 'animate-[pulse_2s_ease-in-out_infinite]'}`} 
                />
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-[8.5px] font-mono tracking-wider font-bold text-white/50 uppercase leading-none mb-1">Wind Speed</span>
                <div className="h-[12px] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentWindSpeed}
                      initial={{ opacity: 0, x: -3 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 3 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] font-sans font-medium text-indigo-100 truncate leading-none block"
                    >
                      {currentWindSpeed} km/h
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Scrollable Hourly forecast and continuous bezier curves */}
        {weather && !loading && weather.hourly && (
          <div className="relative mt-8 z-10 w-full">
            
            {/* Hidden scrollbar scroll shell */}
            <div className="overflow-x-auto scroller-none relative pb-1 scroll-smooth" style={{ scrollbarWidth: "none" }}>
              
              {/* Dynamic scroll content container size based on hourly intervals count */}
              <div 
                className="relative flex select-none" 
                style={{ width: `${weather.hourly.length * 56}px` }}
              >
                {/* SVG Curve layers */}
                <svg 
                  className="absolute top-1 left-0 h-[45px] pointer-events-none" 
                  style={{ width: `${weather.hourly.length * 56}px` }}
                >
                  {/* Dashed timeline guidelines */}
                  {points[activeIndex] && (
                    <line 
                      x1="0" 
                      y1={points[activeIndex].y} 
                      x2={weather.hourly.length * 56} 
                      y2={points[activeIndex].y} 
                      stroke="rgba(255, 255, 255, 0.12)" 
                      strokeDasharray="2,3" 
                      strokeWidth="1" 
                    />
                  )}

                  {/* Bezier temperature connector line */}
                  <path d={pathD} fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="2" strokeLinecap="round" />
                </svg>

                {/* Vertical active highlight line tracker */}
                {points[activeIndex] && (
                  <motion.div
                    className="absolute pointer-events-none border-l border-dashed border-white/25 z-10"
                    style={{
                      left: `${points[activeIndex].x}px`,
                      top: `${points[activeIndex].y + 2}px`,
                      bottom: "38px"
                    }}
                    layoutId="activeTrackingLine"
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  />
                )}

                {/* Glowing Yellow Circular center temperature indicator node */}
                {points[activeIndex] && (
                  <motion.div
                    className="absolute pointer-events-none z-20 w-[11px] h-[11px] rounded-full border-2 border-white bg-amber-400"
                    style={{
                      left: `${points[activeIndex].x - 5.5}px`,
                      top: `${points[activeIndex].y - 5.5}px`
                    }}
                    layoutId="activeTrackingDot"
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  />
                )}

                {/* Map hourly columns */}
                {weather.hourly.map((item, index) => {
                  const label = index === 0 ? "Now" : formatHour(item.time, index === 0);
                  const isActive = index === activeIndex;
                  
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setActiveIndex(index);
                      }}
                      className="w-14 h-[115px] flex flex-col justify-end items-center flex-shrink-0 cursor-pointer pt-1"
                    >
                      {/* Empty spacer to reserve top space for graph SVG line coordinates */}
                      <div className="flex-1" />
                      
                      {/* Hourly dynamic composite cloud icon */}
                      <div className={`mb-2 transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}>
                        {getCustomWeatherIcon(item.weatherCode, item.isDay, 20)}
                      </div>
                      
                      <span className={`text-[10px] font-sans transition-colors ${isActive ? 'text-white font-bold' : 'text-white/55 font-medium'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}

              </div>
            </div>

            <div className="flex justify-center items-center gap-1 mt-2 bg-black/10 rounded-full py-0.5 max-w-[120px] mx-auto opacity-50">
              <span className="text-[7.5px] font-mono text-white/65 uppercase tracking-widest leading-none">TAP TIME TO FORECAST</span>
            </div>

          </div>
        )}

      </div>
    </motion.div>
  );
}
