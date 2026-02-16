Summary: this project is an application server that subscribes to messages from
an MQTT broker, writes them to a database, then offers them back up through a
RESTful interface to any interested clients.

There are 10 different kinds of topics published by the broker. Here are examples:

```
nmea/368323170/DPT {"depth_below_transducer_meters": 1.81, "transducer_depth_meters": 0.0, "water_depth_meters": 1.81, "sentence_type": "DPT", "timestamp": 1771191273887}
nmea/368323170/GGA {"timeUTC": "21:34:34", "latitude": 36.80578666666667, "longitude": -121.785685, "fix_quality": "2", "num_satellites": 25, "hdop": 0.5, "altitude_meter": -21.05, "sentence_type": "GGA", "timestamp": 1771191274621}
nmea/368323170/GLL {"latitude": 36.80578666666667, "longitude": -121.78568666666666, "timeUTC": "21:34:33", "gll_mode": "D", "sentence_type": "GLL", "timestamp": 1771191273235}
nmea/368323170/HDT {"hdg_true": 179.3, "sentence_type": "HDT", "timestamp": 1771191273901}
nmea/368323170/MDA {"pressure_inches": 29.9, "pressure_bars": 1.012, "temperature_air_celsius": 13.4, "temperature_water_celsius": null, "humidity_relative": null, "dew_point_celsius": null, "twd_true": 156.3, "twd_magnetic": null, "tws_knots": 8.18, "tws_mps": 4.21, "pressure_millibars": 1012.0, "sentence_type": "MDA", "timestamp": 1771191273932}
nmea/368323170/MWV {"awa": 328.49, "aws_knots": 9.58, "sentence_type": "MWV", "timestamp": 1771191270777}
nmea/368323170/ROT {"rate_of_turn": 5.73, "sentence_type": "ROT", "timestamp": 1771191272119}
nmea/368323170/RSA {"rudder_angle": -2.0, "sentence_type": "RSA", "timestamp": 1771191270153}
nmea/368323170/VWR {"awa": -23.1, "aws_knots": 9.5, "aws_mps": 4.9, "aws_kph": 17.6, "sentence_type": "VWR", "timestamp": 1771191272354}
nmea/368323170/VTG {"cog_true": 213.09, "cog_magnetic": null, "sog_knots": 0.02, "sog_kph": 0.04, "sentence_type": "VTG", "timestamp": 1771191270317}

```

Topics are published under the pattern `nmea/'MMSI'/'NMEA'` where 'MMSI' is the
MMSI number of a boat, and 'NMEA' is the NMEA sentence type from which the data
is derived. The database schema should include columns for all keys listed
above, except `sentence_type`. In the case of a key that is included in more
than one kind of message, the last received value should be used. Note that
timestamps are in milliseconds of unix epoch time.

The application server should subscribe to the MQTT messages, then accumulate
them for a fixed period of time, typically one minute, then save the accumulated
data to the SQLite server. This converts the irregularly spaced MQTT packets
into regularly spaced database records with all columns filled.

The RESTful interface should return data from the database with timestamps
within an arbitrary time span. The default time span is one hour, ending with
the present time. The endpoint for the interface should be `/api/v1/data`.

Important configuration information, such as the location of the broker, or the
path to the database, should be in a separate JavaScript (not JSON) file.
