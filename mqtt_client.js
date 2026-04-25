/**
 * Copyright (c) 2024-present Tom Keffer <tkeffer@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const mqtt = require('mqtt');
const config = require('./config-loader');
const db = require('./db');

const DEBUG = process.env.DEBUG === '1';
const debug = (...args) => {
    if (DEBUG) console.log('[debug]', ...args);
};

const client = mqtt.connect(config.mqtt.broker);

// Structure record the last data in an archive interval:
const last_value = {};

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe(config.mqtt.topicPattern);
    console.log(`Subscribed to topic pattern ${config.mqtt.topicPattern}`);
});

function handleMessage(topic, message) {
    let [header, mmsi, address_field] = topic.split('/');
    debug(`Received message on topic ${topic}: ${message}`);

    mmsi = parseInt(mmsi, 10);
    if (isNaN(mmsi)) return;

    let data;
    try {
        data = JSON.parse(message.toString());
    } catch (e) {
        console.error('Failed to parse MQTT message', e);
        return;
    }

    const timestamp = data.timestamp;
    if (!timestamp) return;

    const intervalStart = Math.floor(timestamp / config.archive_interval.periodMs) * config.archive_interval.periodMs;

    if (!last_value[mmsi]) {
        last_value[mmsi] = {};
    }

    if (!last_value[mmsi][intervalStart]) {
        last_value[mmsi][intervalStart] = {
            mmsi: mmsi,
            timestamp: intervalStart
        };
    }

    // Note the most recent data, excluding sentence_type and timestamp
    for (const key in data) {
        if (key !== 'sentence_type' && key !== 'timestamp') {
            if (!config.database.exclude_data_types.has(key)) {
                const fullKey = `${address_field}_${key}`;
                last_value[mmsi][intervalStart][fullKey] = data[key];
            }
        }
    }
}

client.on('message', handleMessage);

// Periodically flush data to database
function flush() {
    const now = Date.now();
    const currentIntervalStart = Math.floor(now / config.archive_interval.periodMs) * config.archive_interval.periodMs;

    for (const mmsi in last_value) {
        for (const intervalStart in last_value[mmsi]) {
            // If the interval has passed, save it to the DB and remove from memory
            if (parseInt(intervalStart) < currentIntervalStart) {
                try {
                    debug(
                        `Saving data for MMSI ${mmsi}, timestamp=${intervalStart} (${new Date(Number(intervalStart)).toISOString()})`
                    );
                    db.saveData(last_value[mmsi][intervalStart]);
                    delete last_value[mmsi][intervalStart];
                } catch (e) {
                    console.error('Failed to save data to database', e);
                }
            }
        }
        // Clean up empty mmsi entries
        if (Object.keys(last_value[mmsi]).length === 0) {
            delete last_value[mmsi];
        }

    }
}

setInterval(flush, 10000); // Check every 10 seconds

module.exports = {
    client,
    handleMessage,
    flush,
    accumulation: last_value
};
