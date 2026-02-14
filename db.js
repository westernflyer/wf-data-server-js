const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config.json');

const dbPath = path.isAbsolute(config.database) ? config.database : path.join(__dirname, config.database);
const db = new Database(dbPath);

// Initialize the database
db.exec(`
  CREATE TABLE IF NOT EXISTS telemetry (
    timestamp INTEGER PRIMARY KEY,
    latitude REAL,
    longitude REAL,
    depth REAL,
    true_wind_speed REAL,
    true_wind_direction REAL,
    apparent_wind_speed REAL,
    apparent_wind_direction REAL,
    air_temperature REAL
  )
`);

const insertStmt = db.prepare(`
  INSERT INTO telemetry (timestamp, latitude, longitude, depth, true_wind_speed, true_wind_direction, apparent_wind_speed, apparent_wind_direction, air_temperature)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(timestamp) DO UPDATE SET
    latitude = COALESCE(excluded.latitude, telemetry.latitude),
    longitude = COALESCE(excluded.longitude, telemetry.longitude),
    depth = COALESCE(excluded.depth, telemetry.depth),
    true_wind_speed = COALESCE(excluded.true_wind_speed, telemetry.true_wind_speed),
    true_wind_direction = COALESCE(excluded.true_wind_direction, telemetry.true_wind_direction),
    apparent_wind_speed = COALESCE(excluded.apparent_wind_speed, telemetry.apparent_wind_speed),
    apparent_wind_direction = COALESCE(excluded.apparent_wind_direction, telemetry.apparent_wind_direction),
    air_temperature = COALESCE(excluded.air_temperature, telemetry.air_temperature)
`);

function saveData(data) {
  const {
    timestamp,
    latitude = null,
    longitude = null,
    depth = null,
    true_wind_speed = null,
    true_wind_direction = null,
    apparent_wind_speed = null,
    apparent_wind_direction = null,
    air_temperature = null
  } = data;

  if (!timestamp) return;

  insertStmt.run(
    timestamp,
    latitude,
    longitude,
    depth,
    true_wind_speed,
    true_wind_direction,
    apparent_wind_speed,
    apparent_wind_direction,
    air_temperature
  );
}

function getData(start, end) {
  const query = db.prepare('SELECT * FROM telemetry WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC');
  return query.all(start, end);
}

module.exports = {
  saveData,
  getData
};
