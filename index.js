/*
 * Copyright (c) 2025-2026 Tom Keffer <tkeffer@gmail.com>
 *
 * See the file LICENSE.txt for your full rights.
 */

const config = require('./config');
require('./mqtt_client');
const app = require('./api');

const port = config.server.port;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
