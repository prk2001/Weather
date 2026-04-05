-- ============================================================
-- AETHER TimescaleDB Initialization
-- Weather time-series data schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Observations (station weather readings) ──────────────────

CREATE TABLE observations (
    station_id TEXT NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    temp DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    pressure DOUBLE PRECISION,
    wind_speed DOUBLE PRECISION,
    wind_dir DOUBLE PRECISION,
    wind_gust DOUBLE PRECISION,
    precip_1h DOUBLE PRECISION,
    precip_6h DOUBLE PRECISION,
    visibility DOUBLE PRECISION,
    cloud_cover DOUBLE PRECISION,
    dewpoint DOUBLE PRECISION,
    condition_code TEXT,
    source TEXT NOT NULL
);

SELECT create_hypertable('observations', by_range('time'));
CREATE INDEX idx_obs_station_time ON observations (station_id, time DESC);

-- ── Forecasts (model output) ─────────────────────────────────

CREATE TABLE forecasts (
    model TEXT NOT NULL,
    location_h3 TEXT NOT NULL,
    valid_time TIMESTAMPTZ NOT NULL,
    issued_time TIMESTAMPTZ NOT NULL,
    temp DOUBLE PRECISION,
    temp_min DOUBLE PRECISION,
    temp_max DOUBLE PRECISION,
    feels_like DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    pressure DOUBLE PRECISION,
    wind_speed DOUBLE PRECISION,
    wind_dir DOUBLE PRECISION,
    wind_gust DOUBLE PRECISION,
    precip_prob DOUBLE PRECISION,
    precip_amount DOUBLE PRECISION,
    precip_type TEXT,
    cloud_cover DOUBLE PRECISION,
    uv_index DOUBLE PRECISION,
    visibility DOUBLE PRECISION,
    condition_code TEXT,
    confidence TEXT
);

SELECT create_hypertable('forecasts', by_range('valid_time'));
CREATE INDEX idx_fcst_h3_valid ON forecasts (location_h3, valid_time DESC);
CREATE INDEX idx_fcst_model_h3 ON forecasts (model, location_h3, valid_time DESC);

-- ── Radar Metadata ───────────────────────────────────────────

CREATE TABLE radar_metadata (
    scan_id TEXT NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    coverage_bounds JSONB,
    resolution TEXT,
    source TEXT,
    product_type TEXT
);

SELECT create_hypertable('radar_metadata', by_range('time'));

-- ── Weather Alerts ───────────────────────────────────────────

CREATE TABLE alerts (
    alert_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    certainty TEXT,
    urgency TEXT,
    area_polygon JSONB,
    affected_zones TEXT[],
    issued TIMESTAMPTZ NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    headline TEXT,
    description TEXT,
    instruction TEXT,
    source TEXT NOT NULL
);

SELECT create_hypertable('alerts', by_range('issued'));
CREATE INDEX idx_alerts_severity ON alerts (severity, issued DESC);
CREATE INDEX idx_alerts_expires ON alerts (expires DESC);

-- ── AQI Readings ─────────────────────────────────────────────

CREATE TABLE aqi_readings (
    station_id TEXT NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    pm25 DOUBLE PRECISION,
    pm10 DOUBLE PRECISION,
    o3 DOUBLE PRECISION,
    no2 DOUBLE PRECISION,
    so2 DOUBLE PRECISION,
    co DOUBLE PRECISION,
    aqi_composite INTEGER,
    dominant_pollutant TEXT,
    source TEXT NOT NULL
);

SELECT create_hypertable('aqi_readings', by_range('time'));
CREATE INDEX idx_aqi_station_time ON aqi_readings (station_id, time DESC);

-- ── Pollen Readings ──────────────────────────────────────────

CREATE TABLE pollen_readings (
    region_id TEXT NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    tree_total DOUBLE PRECISION,
    grass_total DOUBLE PRECISION,
    weed_total DOUBLE PRECISION,
    mold_total DOUBLE PRECISION,
    species_breakdown JSONB
);

SELECT create_hypertable('pollen_readings', by_range('time'));

-- ── Accuracy Log ─────────────────────────────────────────────

CREATE TABLE accuracy_log (
    id BIGSERIAL,
    forecast_model TEXT NOT NULL,
    location_h3 TEXT NOT NULL,
    forecast_time TIMESTAMPTZ NOT NULL,
    valid_time TIMESTAMPTZ NOT NULL,
    predicted_temp DOUBLE PRECISION,
    actual_temp DOUBLE PRECISION,
    predicted_precip_prob DOUBLE PRECISION,
    actual_precip BOOLEAN,
    temp_error DOUBLE PRECISION,
    precip_hit BOOLEAN
);

SELECT create_hypertable('accuracy_log', by_range('valid_time'));
CREATE INDEX idx_accuracy_model ON accuracy_log (forecast_model, location_h3, valid_time DESC);

-- ── Compression Policies (compress after 7 days) ─────────────

ALTER TABLE observations SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'station_id',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('observations', INTERVAL '7 days');

ALTER TABLE forecasts SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'model, location_h3',
    timescaledb.compress_orderby = 'valid_time DESC'
);
SELECT add_compression_policy('forecasts', INTERVAL '7 days');

ALTER TABLE aqi_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'station_id',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('aqi_readings', INTERVAL '7 days');

-- ── Retention Policies (drop raw data after 2 years) ─────────

SELECT add_retention_policy('observations', INTERVAL '2 years');
SELECT add_retention_policy('forecasts', INTERVAL '2 years');
SELECT add_retention_policy('aqi_readings', INTERVAL '2 years');
SELECT add_retention_policy('pollen_readings', INTERVAL '2 years');
SELECT add_retention_policy('accuracy_log', INTERVAL '2 years');
