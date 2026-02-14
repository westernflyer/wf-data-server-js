const { startMqtt } = require('./mqtt_handler');
const { startApi } = require('./api');
const config = require('./config.json');

const BROKER_URL = config.mqtt_broker || process.env.MQTT_BROKER || 'mqtt://localhost';

console.log('Starting Western Flyer Data Server...');

startMqtt(BROKER_URL, config.mqtt_topic || 'nmea/+/+');
startApi();
