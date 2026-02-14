const db = require('../db');
const { handleMessage } = require('../mqtt_handler');
const { startApi } = require('../api');
const http = require('http');

async function test() {
  console.log('Running verification tests...');

  // Mock messages
  const messages = [
    {
      sentence_type: 'GLL',
      latitude: 22.929,
      longitude: -109.755,
      timestamp: 1743983731183
    },
    {
      sentence_type: 'DPT',
      depth: 15.5,
      timestamp: 1743983731184
    },
    {
      sentence_type: 'MWV',
      wind_speed: 12.5,
      wind_angle: 45,
      reference: 'R',
      timestamp: 1743983731185
    },
    {
      sentence_type: 'MWV',
      wind_speed: 10.0,
      wind_angle: 90,
      reference: 'T',
      timestamp: 1743983731185 // Same timestamp as above to test UPSERT/COALESCE
    },
    {
      sentence_type: 'MDA',
      air_temp: 25.4,
      timestamp: 1743983731186
    }
  ];

  console.log('1. Processing mock messages...');
  messages.forEach(msg => handleMessage(msg));

  console.log('2. Verifying database content...');
  const allData = db.getData(1743983731180, 1743983731190);
  console.log('Data in DB:', JSON.stringify(allData, null, 2));

  if (allData.length === 0) {
    console.error('FAILED: No data found in DB');
    process.exit(1);
  }

  // Check if UPSERT worked for 1743983731185
  const combinedRow = allData.find(r => r.timestamp === 1743983731185);
  if (combinedRow && combinedRow.apparent_wind_speed === 12.5 && combinedRow.true_wind_speed === 10.0) {
    console.log('SUCCESS: UPSERT/COALESCE worked correctly for merged data at same timestamp');
  } else {
    console.error('FAILED: UPSERT/COALESCE did not merge data correctly', combinedRow);
  }

  console.log('3. Testing API endpoint...');
  startApi(); // Starts on port from config or 3000

  // Insert a message from "now" to test default time span
  const now = Date.now();
  handleMessage({
    sentence_type: 'MDA',
    air_temp: 20.0,
    timestamp: now
  });

  // Wait a bit for server to start
  setTimeout(() => {
    console.log('3a. Testing API with explicit parameters...');
    http.get('http://localhost:3000/api/v1/data?start=1743983731183&end=1743983731185', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const result = JSON.parse(data);
        console.log('API Result (explicit):', result.length, 'rows');
        if (result.length !== 3) {
           console.error(`FAILED: API returned ${result.length} rows instead of 3`);
           process.exit(1);
        }

        console.log('3b. Testing API with default parameters (last 1h)...');
        http.get('http://localhost:3000/api/v1/data', (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            const result = JSON.parse(data);
            console.log('API Result (default):', result.length, 'rows');
            const foundNow = result.some(r => r.timestamp === now);
            if (foundNow) {
              console.log('SUCCESS: API default range included the recent data point');
              process.exit(0);
            } else {
              console.error('FAILED: API default range did NOT include the recent data point');
              process.exit(1);
            }
          });
        });
      });
    }).on('error', (err) => {
      console.error('API Test Error:', err.message);
      process.exit(1);
    });
  }, 1000);
}

test();
