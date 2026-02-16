/*
 * Copyright (c) 2025-2026 Tom Keffer <tkeffer@gmail.com>
 *
 * See the file LICENSE.txt for your full rights.
 */

const Database = require('better-sqlite3');
const config = require('./config');

const dbPath = process.env.DB_PATH || config.database.path;
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS data (
    mmsi TEXT,
    timestamp INTEGER,
    awa REAL,
    aws_knots REAL,
    cog_true REAL,
    dew_point_celsius REAL,
    hdg_true REAL,
    humidity_relative REAL,
    latitude REAL,
    longitude REAL,
    pressure_millibars REAL,
    rate_of_turn REAL,
    rudder_angle REAL,
    sog_knots REAL,
    temperature_air_celsius REAL,
    temperature_water_celsius REAL,
    twd_true REAL,
    tws_knots REAL,
    water_depth_meters REAL,
    PRIMARY KEY (mmsi, timestamp)
  )
`);

// Cache the schema so we can whitelist columns + coerce types
const tableInfo = db.prepare('PRAGMA table_info(data)').all();
const columnTypeByName = new Map(
    tableInfo.map(col => [col.name, (col.type || '').toUpperCase()])
);

function coerceToDeclaredType(columnName, value) {
    if (value === undefined) return undefined; // omit
    if (value === null) return null; // keep nulls (SQLite will store NULL)

    const declared = columnTypeByName.get(columnName);
    if (!declared) return undefined; // unknown column => omit

    if (declared.includes('TEXT')) {
        return String(value);
    }

    if (declared.includes('INTEGER')) {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) return undefined; // invalid => omit
        return Math.trunc(n);
    }

    if (declared.includes('REAL')) {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) return undefined; // invalid => omit
        return n;
    }

    // Fallback: accept as-is for other types you might add later
    return value;
}

module.exports = {
    saveData(data) {
        // Require primary key fields
        if (!data || data.mmsi == null || data.timestamp == null) {
            throw new Error('saveData requires mmsi and timestamp');
        }

        // Whitelist columns + ignore invalid-type values
        const entries = [];
        for (const [col, rawVal] of Object.entries(data)) {
            if (!columnTypeByName.has(col)) continue; // ignore unknown fields
            const val = coerceToDeclaredType(col, rawVal);
            if (val === undefined) continue;          // ignore invalid-type (and undefined)
            entries.push([col, val]);
        }

        const columns = entries.map(([col]) => col);
        const values = entries.map(([, val]) => val);

        // If nothing valid beyond PK made it through, we can still insert PK only.
        // (This keeps the upsert behavior consistent.)
        const placeholders = columns.map(() => '?').join(',');

        const updates = columns
            .filter(col => col !== 'mmsi' && col !== 'timestamp')
            .map(col => `${col}=excluded.${col}`)
            .join(',');

        const sql = updates.length > 0
            ? `
        INSERT INTO data (${columns.join(',')})
        VALUES (${placeholders})
        ON CONFLICT(mmsi, timestamp) DO UPDATE SET ${updates}
      `
            : `
        INSERT INTO data (${columns.join(',')})
        VALUES (${placeholders})
        ON CONFLICT(mmsi, timestamp) DO NOTHING
      `;

        db.prepare(sql).run(values);
    },

    getData(startTime, endTime, limit, direction = 'ASC') {
        const dir = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        let sql = `SELECT * FROM data WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ${dir}`;
        const params = [startTime, endTime];

        if (limit !== undefined && limit !== null) {
            sql += ' LIMIT ?';
            params.push(limit);
        }

        const stmt = db.prepare(sql);
        return stmt.all(...params);
    }
};
