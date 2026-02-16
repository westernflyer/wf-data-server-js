const express = require('express');
const db = require('./db');
const config = require('./config');

const app = express();

app.get('/api/v1/data', (req, res) => {
  const now = Date.now();
  const defaultStart = now - (60 * 60 * 1000); // 1 hour ago

  const startTime = req.query.start ? parseInt(req.query.start) : defaultStart;
  const endTime = req.query.end ? parseInt(req.query.end) : now;

  if (isNaN(startTime) || isNaN(endTime)) {
    return res.status(400).json({ error: 'Invalid start or end time' });
  }

  try {
    const data = db.getData(startTime, endTime);
    res.json(data);
  } catch (e) {
    console.error('Error fetching data from database', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
