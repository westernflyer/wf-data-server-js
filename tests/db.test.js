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
            timestamp: now,
            temperature_air_celsius: 15.5
        };

        db.saveData(data);
        const results = db.getData(test_mmsi,now - 1000, now + 1000);
        
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].mmsi, 123456789);
        assert.strictEqual(results[0].temperature_air_celsius, 15.5);
    });

    it('should respect limit parameter', () => {
        const now = Date.now();
        for (let i = 0; i < 5; i++) {
            db.saveData({
                mmsi: test_mmsi,
                timestamp: now + i,
                awa: i
            });
        }

        const results = db.getData(test_mmsi, now, now + 10, 3);
        assert.strictEqual(results.length, 3);
    });

    it('should respect direction parameter', () => {
        const now = Date.now();
        db.saveData({ mmsi: test_mmsi, timestamp: now, awa: 1 });
        db.saveData({ mmsi: test_mmsi, timestamp: now + 1, awa: 2 });

        const asc = db.getData(test_mmsi, now, now + 1, null, 'asc');
        assert.strictEqual(asc[0].timestamp, now);

        const desc = db.getData(test_mmsi, now, now + 1, null, 'desc');
        assert.strictEqual(desc[0].timestamp, now + 1);
    });
});
