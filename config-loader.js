/**
 * Copyright (c) 2024-present Tom Keffer <tkeffer@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');
const toml = require('smol-toml');

// Check for a config path in the command line arguments
let configPath = path.join(__dirname, 'config.toml');
const configIndex = process.argv.indexOf('--config');
if (configIndex !== -1 && process.argv[configIndex + 1]) {
    configPath = process.argv[configIndex + 1];
}

const configContent = fs.readFileSync(configPath, 'utf8');
const config = toml.parse(configContent);

// Convert exclude_data_types to a Set for compatibility
if (config.database && Array.isArray(config.database.exclude_data_types)) {
    config.database.exclude_data_types = new Set(config.database.exclude_data_types);
}

module.exports = config;
