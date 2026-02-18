/**
 * Copyright (c) 2024-present Tom Keffer <tkeffer@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const express = require('express');
const db = require('./db');

const app = express();

app.get('/api/v1/data/:mmsi', (req, res) => {
  const { mmsi } = req.params;
  const now = Date.now();
  const defaultStart = now - (60 * 60 * 1000); // 1 hour ago

  const startTime = req.query.start ? parseInt(req.query.start) : defaultStart;
  const endTime = req.query.end ? parseInt(req.query.end) : now;
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
  const direction = req.query.direction || 'asc';

  if (isNaN(startTime) || isNaN(endTime) || (req.query.limit && isNaN(limit))) {
    return res.status(400).json({ error: 'Invalid start, end or limit' });
  }

  if (!['asc', 'desc'].includes(direction.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid direction. Use "asc" or "desc"' });
  }

  try {
    const data = db.getData(mmsi, startTime, endTime, limit, direction);
    res.json(data);
  } catch (e) {
    console.error('Error fetching data from database', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
