const mqtt = require('mqtt');
const config = require('./config');
const db = require('./db');

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
  console.log(`Received message on topic ${topic}: ${message}`);

  const mmsi = parts[1];
  const sentenceType = parts[2];
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
            console.log(`Saving data for ${mmsi} to database`);
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
