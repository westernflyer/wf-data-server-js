const mqtt = require('mqtt');
const db = require('./db');

function startMqtt(brokerUrl, topic) {
  const client = mqtt.connect(brokerUrl || 'mqtt://localhost');
  const subscribeTopic = topic || 'nmea/+/+';

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe(subscribeTopic, (err) => {
      if (err) {
        console.error('Failed to subscribe to MQTT topics', err);
      } else {
        console.log(`Subscribed to ${subscribeTopic}`);
      }
    });
  });

  client.on('message', (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      handleMessage(payload);
    } catch (e) {
      console.error('Error parsing MQTT message', e);
    }
  });

  return client;
}

function handleMessage(payload) {
  const sentenceType = payload.sentence_type;
  const timestamp = payload.timestamp;

  if (!timestamp) return;

  const data = { timestamp };

  switch (sentenceType) {
    case 'GLL':
    case 'GGA':
    case 'RMC':
      data.latitude = payload.latitude;
      data.longitude = payload.longitude;
      break;
    case 'DPT':
      data.depth = payload.depth || payload.water_depth_m;
      break;
    case 'MWV':
      if (payload.reference === 'T') {
        data.true_wind_speed = payload.wind_speed;
        data.true_wind_direction = payload.wind_angle;
      } else if (payload.reference === 'R') {
        data.apparent_wind_speed = payload.wind_speed;
        data.apparent_wind_direction = payload.wind_angle;
      }
      break;
    case 'MDA':
      data.air_temperature = payload.air_temp;
      break;
    case 'VWR':
      // VWR provides speed in knots, meters/sec, km/hr. We'll prefer knots if available or just wind_speed
      data.apparent_wind_speed = payload.wind_speed_knots || payload.speed_knots;
      data.apparent_wind_direction = payload.wind_angle || payload.angle_relative;
      break;
    // Sentences like HDT, ROT, RSA, VTG are subscribed but not in the requested schema fields
    default:
      // Other sentences might have fields we can use, but we'll stick to the requested ones.
      break;
  }

  // Only save if we found some relevant fields
  if (Object.keys(data).length > 1) {
    db.saveData(data);
  }
}

module.exports = {
  startMqtt,
  handleMessage
};
