const express = require('express');
const db = require('./db');
const config = require('./config.json');

const app = express();
const port = config.api_port || process.env.PORT || 3000;

app.get('/api/v1/data', (req, res) => {
  const { start, end } = req.query;

  const now = Date.now();
  const oneHourAgo = now - 3600000;

  const startTime = start ? parseInt(start) : oneHourAgo;
  const endTime = end ? parseInt(end) : now;

  if (isNaN(startTime) || isNaN(endTime)) {
    return res.status(400).json({ error: 'Start and end must be valid numbers (timestamps)' });
  }

  try {
    const data = db.getData(startTime, endTime);
    res.json(data);
  } catch (err) {
    console.error('Error fetching data', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function startApi() {
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

module.exports = {
  startApi
};
