import { create } from 'zustand';
import type { CurrentConditions, HourlyForecast, DailyForecast, WeatherAlert } from '@aether/shared';
import {
  getGridPoint,
  fetchCurrentConditions,
  fetchHourlyForecast,
  fetchDailyForecast,
  fetchAlerts,
} from '../lib/nws-api';

interface WeatherState {
  current: CurrentConditions | null;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  loading: boolean;
  error: string | null;
  locationName: string;
  fetchWeather: (lat: number, lon: number) => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  current: null,
  hourly: [],
  daily: [],
  alerts: [],
  loading: false,
  error: null,
  locationName: '',

  fetchWeather: async (lat: number, lon: number) => {
    set({ loading: true, error: null });

    try {
      // Step 1: Get NWS grid point for this location
      const grid = await getGridPoint(lat, lon);
      const locationName = grid.city && grid.state
        ? `${grid.city}, ${grid.state}`
        : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

      set({ locationName });

      // Step 2: Fetch all data in parallel
      const [current, hourly, daily, alerts] = await Promise.all([
        fetchCurrentConditions(lat, lon, grid),
        fetchHourlyForecast(grid),
        fetchDailyForecast(grid),
        fetchAlerts(lat, lon),
      ]);

      set({
        current,
        hourly,
        daily,
        alerts,
        loading: false,
      });
    } catch (err) {
      console.error('[AETHER] Weather fetch failed:', err);
      // Only show error if we have no existing data — otherwise silently keep last valid data
      const hasData = useWeatherStore.getState().current !== null;
      set({
        error: hasData ? null : (err instanceof Error ? err.message : 'Failed to fetch weather data'),
        loading: false,
      });
    }
  },
}));
