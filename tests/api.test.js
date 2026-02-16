/*
 * Copyright (c) 2025-2026 Tom Keffer <tkeffer@gmail.com>
 *
 * See the file LICENSE.txt for your full rights.
 */

const testDbPath = '/tmp/test_api_' + Date.now() + '.db';
process.env.DB_PATH = testDbPath;

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
        db.saveData({ mmsi: 'api_test', timestamp: now - 10000, awa: 10 });
        db.saveData({ mmsi: 'api_test', timestamp: now - 5000, awa: 20 });
    });

    after(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    it('GET /api/v1/data should return records', async () => {
        const res = await request(app).get('/api/v1/data');
        assert.strictEqual(res.status, 200);
        assert(Array.isArray(res.body));
        assert.strictEqual(res.body.length, 2);
    });

    it('GET /api/v1/data should respect limit', async () => {
        const res = await request(app).get('/api/v1/data?limit=1');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.length, 1);
    });

    it('GET /api/v1/data should respect direction', async () => {
        const res = await request(app).get('/api/v1/data?direction=desc');
        assert.strictEqual(res.status, 200);
        assert(res.body[0].timestamp > res.body[1].timestamp);
    });

    it('GET /api/v1/data should return 400 for invalid limit', async () => {
        const res = await request(app).get('/api/v1/data?limit=abc');
        assert.strictEqual(res.status, 400);
    });

    it('GET /api/v1/data should return 400 for invalid direction', async () => {
        const res = await request(app).get('/api/v1/data?direction=foo');
        assert.strictEqual(res.status, 400);
    });
});
