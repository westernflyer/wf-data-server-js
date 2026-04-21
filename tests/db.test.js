/**
 * Copyright (c) 2024-present Tom Keffer <tkeffer@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const testDbPath = '/tmp/test_db_' + Date.now() + '.db';
process.env.DB_PATH = testDbPath;

const test_mmsi = 123456789;

const { describe, it, after } = require('node:test');
const assert = require('node:assert');
const db = require('../db');
const fs = require('node:fs');

describe('Database Tests', () => {
    after(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    it('should save and retrieve data', () => {
        const now = Date.now();
        const data = {
            mmsi: test_mmsi,
            channel: 'ch1',
            timestamp: now,
            temperature_air_celsius: 15.5
        };

        db.saveData(data);
        const results = db.getData(test_mmsi, 'ch1', now - 1000, now + 1000, null, 'ASC');
        
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].mmsi, 123456789);
        assert.strictEqual(results[0].temperature_air_celsius, 15.5);
    });

    it('should respect limit parameter', () => {
        const now = Date.now();
        for (let i = 0; i < 5; i++) {
            db.saveData({
                mmsi: test_mmsi,
                channel: 'ch1',
                timestamp: now + i,
                awa: i
            });
        }

        const results = db.getData(test_mmsi, 'ch1', now, now + 10, 3);
        assert.strictEqual(results.length, 3);
    });

    it('should respect direction parameter', () => {
        const now = Date.now();
        db.saveData({ mmsi: test_mmsi, channel: 'ch1', timestamp: now, awa: 1 });
        db.saveData({ mmsi: test_mmsi, channel: 'ch1', timestamp: now + 1, awa: 2 });

        const asc = db.getData(test_mmsi, 'ch1', now, now + 1, null, 'asc');
        assert.strictEqual(asc[0].timestamp, now);

        const desc = db.getData(test_mmsi, 'ch1', now, now + 1, null, 'desc');
        assert.strictEqual(desc[0].timestamp, now + 1);
    });

    it('should handle different channels', () => {
        const now = Date.now();
        db.saveData({ mmsi: test_mmsi, channel: 'ch1', timestamp: now, temperature_air_celsius: 10 });
        db.saveData({ mmsi: test_mmsi, channel: 'ch2', timestamp: now, temperature_air_celsius: 20 });

        const ch1 = db.getData(test_mmsi, 'ch1', now, now, null, 'asc');
        assert.strictEqual(ch1.length, 1);
        assert.strictEqual(ch1[0].temperature_air_celsius, 10);

        const ch2 = db.getData(test_mmsi, 'ch2', now, now, null, 'asc');
        assert.strictEqual(ch2.length, 1);
        assert.strictEqual(ch2[0].temperature_air_celsius, 20);

        const all = db.getData(test_mmsi, 'ALL', now, now, null, 'asc');
        assert.strictEqual(all.length, 2);
        assert.strictEqual(all.length, 2);
    });
});
