/**
 * Copyright (c) 2024-present Tom Keffer <tkeffer@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const mqtt = require('mqtt');
const config = require('./config');
const db = require('./db');

const DEBUG = process.env.DEBUG === '1';
const debug = (...args) => {
    if (DEBUG) console.log('[debug]', ...args);
};

const client = mqtt.connect(config.mqtt.broker);

// Structure to store accumulated data: { [mmsi]: { [channel]: { [intervalStart]: { data } } } }
const accumulation = {};

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe(config.mqtt.topicPattern);
    console.log(`Subscribed to topic pattern ${config.mqtt.topicPattern}`);
});

function handleMessage(topic, message) {
    const parts = topic.split('/');
    if (parts.length !== 4 || parts[0] !== 'nmea') return;

    debug(`Received message on topic ${topic}: ${message}`);

    const mmsi = parseInt(parts[1], 10);
    if (isNaN(mmsi)) return;

    const channel = parts[2];

    // The NMEA sentence type is unused:
    // const sentenceType = parts[3]
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

    if (!accumulation[mmsi][channel]) {
        accumulation[mmsi][channel] = {};
    }

    if (!accumulation[mmsi][channel][intervalStart]) {
        accumulation[mmsi][channel][intervalStart] = {
            mmsi: mmsi,
            channel: channel,
            timestamp: intervalStart
        };
    }

    // Merge data, excluding sentence_type and timestamp
    for (const key in data) {
        if (key !== 'sentence_type' && key !== 'timestamp') {
            accumulation[mmsi][channel][intervalStart][key] = data[key];
        }
    }
}

client.on('message', handleMessage);

// Periodically flush data to database
function flush() {
    const now = Date.now();
    const currentIntervalStart = Math.floor(now / config.accumulation.periodMs) * config.accumulation.periodMs;

    for (const mmsi in accumulation) {
        for (const channel in accumulation[mmsi]) {
            for (const intervalStart in accumulation[mmsi][channel]) {
                // If the interval has passed, save it to the DB and remove from memory
                if (parseInt(intervalStart) < currentIntervalStart) {
                    try {
                        debug(
                            `Saving data for MMSI ${mmsi}, channel ${channel}, timestamp=${intervalStart} (${new Date(Number(intervalStart)).toISOString()})`
                        );
                        db.saveData(accumulation[mmsi][channel][intervalStart]);
                        delete accumulation[mmsi][channel][intervalStart];
                    } catch (e) {
                        console.error('Failed to save data to database', e);
                    }
                }
            }
            // Clean up empty mmsi entries
            if (Object.keys(accumulation[mmsi][channel]).length === 0) {
                delete accumulation[mmsi][channel];
            }
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
