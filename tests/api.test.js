/**
 * Copyright (c) 2024-present Tom Keffer <tkeffer@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const testDbPath = '/tmp/test_api_' + Date.now() + '.db';
process.env.DB_PATH = testDbPath;

const test_mmsi = 123456789;

const { describe, it, before, after } = require('node:test');
const request = require('supertest');
const assert = require('node:assert');
const app = require('../api');
const db = require('../db');
const fs = require('node:fs');

describe('API Tests', () => {
    before(() => {
        // Populate with some data
        const now = Date.now();
        db.saveData({ mmsi: test_mmsi, timestamp: now - 10000, awa: 10 });
        db.saveData({ mmsi: test_mmsi, timestamp: now - 5000, awa: 20 });
    });

    after(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    it('GET /api/v1/data should return records', async () => {
        const res = await request(app).get(`/api/v1/data/${test_mmsi}`);
        assert.strictEqual(res.status, 200);
        assert(Array.isArray(res.body));
        assert.strictEqual(res.body.length, 2);
    });

    it('GET /api/v1/data should respect limit', async () => {
        const res = await request(app).get(`/api/v1/data/${test_mmsi}?limit=1`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.length, 1);
    });

    it('GET /api/v1/data should respect direction', async () => {
        const res = await request(app).get(`/api/v1/data/${test_mmsi}?direction=desc`);
        assert.strictEqual(res.status, 200);
        assert(res.body[0].timestamp > res.body[1].timestamp);
    });

    it('GET /api/v1/data should return 400 for invalid limit', async () => {
        const res = await request(app).get(`/api/v1/data/${test_mmsi}?limit=abc`);
        assert.strictEqual(res.status, 400);
    });

    it('GET /api/v1/data should return 400 for invalid direction', async () => {
        const res = await request(app).get(`/api/v1/data/${test_mmsi}?direction=foo`);
        assert.strictEqual(res.status, 400);
    });
});
