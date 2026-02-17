/*
 * Copyright (c) 2025-2026 Tom Keffer <tkeffer@gmail.com>
 *
 * See the file LICENSE.txt for your full rights.
 */

const mqtt = require('mqtt');
const config = require('./config');
const db = require('./db');

const DEBUG = process.env.DEBUG === '1';
const debug = (...args) => { if (DEBUG) console.log('[debug]', ...args); };

const client = mqtt.connect(config.mqtt.broker);

// Structure to store accumulated data: { [mmsi]: { [intervalStart]: { data } } }
const accumulation = {};

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(config.mqtt.topicPattern);
});

function handleMessage(topic, message) {
  const parts = topic.split('/');
  if (parts.length !== 3 || parts[0] !== 'nmea') return;
  debug(`Received message on topic ${topic}: ${message}`);

  const mmsi = parts[1];
  // The NMEA sentence type is unused:
  // const sentenceType = parts[2];
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (e) {
    console.error('Failed to parse MQTT message', e);
    return;
  }

  const timestamp = data.timestamp;
  if (!timestamp) return;

  const intervalStart = Math.floor(timestamp / config.accumulation.periodMs) * config.accumulation.periodMs;

  if (!accumulation[mmsi]) {
    accumulation[mmsi] = {};
  }

  if (!accumulation[mmsi][intervalStart]) {
    accumulation[mmsi][intervalStart] = {
      mmsi: mmsi,
      timestamp: intervalStart
    };
  }

  // Merge data, excluding sentence_type
  for (const key in data) {
    if (key !== 'sentence_type' && key !== 'timestamp') {
      accumulation[mmsi][intervalStart][key] = data[key];
    }
  }
}

client.on('message', handleMessage);

// Periodically flush data to database
function flush() {
  const now = Date.now();
  const currentIntervalStart = Math.floor(now / config.accumulation.periodMs) * config.accumulation.periodMs;

  for (const mmsi in accumulation) {
    for (const intervalStart in accumulation[mmsi]) {
      // If the interval has passed, save it to the DB and remove from memory
      if (parseInt(intervalStart) < currentIntervalStart) {
        try {
            debug(
                `Saving data for ${mmsi}, timestamp=${intervalStart} (${new Date(Number(intervalStart)).toISOString()})`
            );
            db.saveData(accumulation[mmsi][intervalStart]);
            delete accumulation[mmsi][intervalStart];
        } catch (e) {
            console.error('Failed to save data to database', e);
        }
      }
    }
    // Clean up empty mmsi entries
    if (Object.keys(accumulation[mmsi]).length === 0) {
      delete accumulation[mmsi];
    }
  }
}

setInterval(flush, 10000); // Check every 10 seconds

module.exports = {
  client,
  handleMessage,
  flush,
  accumulation
};
