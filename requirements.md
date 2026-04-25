Summary: this project is an application server that subscribes to messages from
an MQTT broker, writes them to a database, then offers them back up through a
RESTful interface to any interested clients.

There are 8 different kinds of topics published by the broker. Here are examples:

```
nmea/368323170/FTMWV {"awa": 56.0, "aws_knots": 5.1, "sentence_type": "MWV", "timestamp": 1776885056777}
nmea/368323170/GPGLL {"latitude": 36.80578166666667, "longitude": -121.78567833333334, "timeUTC": "19:10:14", "gll_mode": "D", "sentence_type": "GLL", "timestamp": 1776885014842}
nmea/368323170/GPVTG {"cog_true": 100.08, "cog_magnetic": null, "sog_knots": 0.0, "sog_kph": 0.0, "sentence_type": "VTG", "timestamp": 1776885015433}
nmea/368323170/HEHDT {"hdg_true": 176.4, "sentence_type": "HDT", "timestamp": 1776885034334}
nmea/368323170/IIMDA {"pressure_inches": 30.2, "pressure_bars": 1.024, "temperature_air_celsius": 15.1, "temperature_water_celsius": null, "humidity_relative": null, "dew_point_celsius": null, "twd_true": 243.59, "twd_magnetic": null, "tws_knots": 5.0, "tws_mps": 2.57, "pressure_millibars": 1024.0, "sentence_type": "MDA", "timestamp": 1776885025218}
nmea/368323170/IIRSA {"rudder_angle": -1.8, "sentence_type": "RSA", "timestamp": 1776885015715}
nmea/368323170/TIROT {"rate_of_turn": 0.04, "sentence_type": "ROT", "timestamp": 1776885035754}
nmea/368323170/WIMWV {"awa": 61.9, "aws_knots": 5.19, "sentence_type": "MWV", "timestamp": 1776885025549}

```

Timestamps are in milliseconds of unix epoch time.

Topics are published under the pattern `nmea/'MMSI'/'address_field'` where
'MMSI' is the MMSI number of a boat, and `address_field` is the NMEA sentence
type from which the data is derived. Note that address fields `FTMWV` and
`WIMWV` have identical data fields, but they should be kept separate. This
requires a database schema that looks like this:

```SQL
CREATE TABLE IF NOT EXISTS data
(
    mmsi                            INTEGER NOT NULL,
    timestamp                       INTEGER NOT NULL,
    FTMWV_awa                       REAL,
    FTMWV_aws_knots                 REAL,
    GPGLL_latitude                  REAL,
    GPGLL_longitude                 REAL,
    GPVTG_cog_true                  REAL,
    GPVTG_sog_knots                 REAL,
    HEHDT_hdg_true                  REAL,
    IIMDA_dew_point_celsius         REAL,
    IIMDA_humidity_relative         REAL,
    IIMDA_pressure_millibars        REAL,
    IIMDA_temperature_air_celsius   REAL,
    IIMDA_temperature_water_celsius REAL,
    IIMDA_twd_true                  REAL,
    IIMDA_tws_knots                 REAL,
    IIMDA_tws_mps                   REAL,
    IIRSA_rudder_angle              REAL,
    TIROT_rate_of_turn              REAL,
    WIMWV_awa                       REAL,
    WIMWV_aws_knots                 REAL
)
```

Note that the column names are a concatenation of the source address field and
the data type.

The application server should subscribe to the MQTT messages, then accumulate
them for a fixed period of time, typically one minute, then save the accumulated
data to the SQLite server. This converts the irregularly spaced MQTT packets
into data with the same timestamp.

The RESTful interface should return data from the database with timestamps
within an arbitrary time span. The default time span is 12 hours, ending with
the present time. The endpoint for the interface should be `/api/v1/data/:mmsi`.

Important configuration information, such as the location of the broker, or the
path to the database, should be in a TOML file. By default, the application
looks for `config.toml` in the application directory, but an alternative
location can be specified on the command line using the `--config` option.

Note that an earlier implementation of this project used a different database
format. In particular, it recorded `channel`, which is no longer used. 