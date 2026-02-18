/**
 * Copyright (c) 2024-present Tom Keffer <tkeffer@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const config = require('./config');
require('./mqtt_client');
const app = require('./api');

const port = config.server.port;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
