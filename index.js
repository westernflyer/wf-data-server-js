const config = require('./config');
require('./mqtt_client');
const app = require('./api');

const port = config.server.port;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
