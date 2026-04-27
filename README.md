# NMEA data logger and server

This server subscribes to NMEA data from an MQTT broker, then writes the data to an
SQLite database. It then exposes a RESTful API to retrieve the data.

## Prerequisites

* Node.js 20.18 or later
* MQTT broker (e.g. Mosquitto)

## Database schema

Sample entries from the database:

```text
     mmsi|    timestamp|FTMWV_awa|FTMWV_aws_knots|  GPGLL_latitude|   GPGLL_longitude|GPVTG_cog_true|GPVTG_sog_knots|HEHDT_hdg_true|IIMDA_dew_point_celsius|IIMDA_humidity_relative|IIMDA_pressure_millibars|IIMDA_temperature_air_celsius|IIMDA_temperature_water_celsius|IIMDA_twd_true|IIMDA_tws_knots|IIRSA_rudder_angle|SDDPT_depth_below_transducer_meters |TIROT_rate_of_turn|WIMWV_awa|WIMWV_aws_knots
368323170|1777155900000|    294.0|            9.0|37.1523716666667|-122.736955       |        316.34|           8.57|         315.2|                       |                       |                  1013.0|                         11.2|                               |        244.19|          10.09|              -3.0|                                    |              3.63|         |
368323170|1777155960000|    308.0|            7.7|       37.154215|-122.739191666667 |        315.32|           8.86|         315.8|                       |                       |                  1013.0|                         11.2|                               |        241.59|          10.38|              -3.1|                               99.59|             -1.17|         |
368323170|1777156080000|    306.0|           12.0|37.1576983333333|-122.743473333333 |        315.18|           8.59|         314.8|                       |                       |                  1013.0|                         11.1|                               |         239.3|           9.68|              -3.4|                               55.21|            -14.92|         |
368323170|1777159440000|    327.0|           19.0|37.2577766666667|-122.855228333333 |         328.2|           8.92|         329.0|                       |                       |                  1012.0|                         11.9|                               |        274.59|          14.38|              -3.7|                               81.98|             -17.3|         |
368323170|1777159500000|    324.0|           17.8|        37.25981|-122.857071666667 |        320.73|           8.83|         321.0|                       |                       |                  1012.0|                         11.9|                               |        284.29|          12.38|              -3.5|                               68.15|             -6.38|         |
...
```


## API

### Get records

Return all records for a given MMSI within a given time span.

```
GET /api/v1/data/:mmsi/
```

**Routing parameters**

| *Name* | *Type* | *Description*                            |
|:-------|:-------|:-----------------------------------------|
| `mmsi` | string | Limit the query to this mmsi (required). |


**Query parameters**

| *Name*      | *Type*  | *Description*                                                                                                                     |
|:------------|:--------|:----------------------------------------------------------------------------------------------------------------------------------|
| `start`     | integer | All records greater than this timestamp in milliseconds will be included in the results. Default: 12 hours before present time.   |
| `end`       | integer | All records less than or equal to this timestamp in milliseconds will be included in the results. Default: last available record. |
| `limit`     | integer | Limit the number of returned packets to this value. Default: no limit.                                                            |
| `direction` | string  | The direction of the sort. Can be either `asc` or `desc`. Default: `asc`.                                                         |


**Response code**

| *Status* | *Meaning*          |
|:---------|:-------------------|
| 200      | Success            |
| 400      | Malformed query    |
| 404      | MMSI not specified |

**Examples**

Ask for the default time span: all records for the last 12 hours.

```shell
$  curl -i --silent -X GET 'http://localhost:3001/api/v1/data/368323170'
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 2274
ETag: W/"8e2-Ndmo1StHCwJZK2VBitFgMUyaIEQ"
Date: Mon, 27 Apr 2026 22:15:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":368323170,"timestamp":1777292400000,"FTMWV_awa":3,"FTMWV_aws_knots":11,"GPGLL_latitude":41.531125,"GPGLL_longitude":-124.36994333333334,"GPVTG_cog_true":16.51,"GPVTG_sog_knots":8.18,"HEHDT_hdg_true":14.9,"IIMDA_dew_point_celsius":null,"IIMDA_humidity_relative":null,"IIMDA_pressure_millibars":1018,"IIMDA_temperature_air_celsius":9.8,"IIMDA_temperature_water_celsius":null,"IIMDA_twd_true":350.29,"IIMDA_tws_knots":9.29,"IIRSA_rudder_angle":-3.8,"SDDPT_depth_below_transducer_meters":49,"TIROT_rate_of_turn":-5.98,"WIMWV_awa":null,"WIMWV_aws_knots":null},
  {"mmsi":368323170,"timestamp":1777292460000,"FTMWV_awa":341,"FTMWV_aws_knots":14.4,"GPGLL_latitude":41.53333833333333,"GPGLL_longitude":-124.36922333333334,"GPVTG_cog_true":15.09,"GPVTG_sog_knots":8.2,"HEHDT_hdg_true":12.8,"IIMDA_dew_point_celsius":null,"IIMDA_humidity_relative":null,"IIMDA_pressure_millibars":1018,"IIMDA_temperature_air_celsius":9.8,"IIMDA_temperature_water_celsius":null,"IIMDA_twd_true":331.19,"IIMDA_tws_knots":7.89,"IIRSA_rudder_angle":-2.5,"SDDPT_depth_below_transducer_meters":46.34,"TIROT_rate_of_turn":20.05,"WIMWV_awa":null,"WIMWV_aws_knots":null},
  {"mmsi":368323170,"timestamp":1777292520000,"FTMWV_awa":344,"FTMWV_aws_knots":14,"GPGLL_latitude":41.53551,"GPGLL_longitude":-124.36816666666667,"GPVTG_cog_true":23.39,"GPVTG_sog_knots":8.3,"HEHDT_hdg_true":23.8,"IIMDA_dew_point_celsius":null,"IIMDA_humidity_relative":null,"IIMDA_pressure_millibars":1018,"IIMDA_temperature_air_celsius":9.8,"IIMDA_temperature_water_celsius":null,"IIMDA_twd_true":338.79,"IIMDA_tws_knots":9.19,"IIRSA_rudder_angle":-3.5,"SDDPT_depth_below_transducer_meters":47.78,"TIROT_rate_of_turn":26.06,"WIMWV_awa":null,"WIMWV_aws_knots":null},
  {"mmsi":368323170,"timestamp":1777292580000,"FTMWV_awa":341,"FTMWV_aws_knots":14,"GPGLL_latitude":41.537333333333336,"GPGLL_longitude":-124.367255,"GPVTG_cog_true":18.91,"GPVTG_sog_knots":8.26,"HEHDT_hdg_true":15,"IIMDA_dew_point_celsius":null,"IIMDA_humidity_relative":null,"IIMDA_pressure_millibars":1018,"IIMDA_temperature_air_celsius":9.8,"IIMDA_temperature_water_celsius":null,"IIMDA_twd_true":330.79,"IIMDA_tws_knots":10.5,"IIRSA_rudder_angle":-3.5,"SDDPT_depth_below_transducer_meters":52.01,"TIROT_rate_of_turn":-8.75,"WIMWV_awa":null,"WIMWV_aws_knots":null},
  ...
]
```

Query again but limit the results to 2 records:

```shell
curl -i --silent -X GET 'http://localhost:3001/api/v1/data/368323170?limit=2'
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 1141
ETag: W/"475-GNZgeCyAAUjpuxH7s7AHcfx33BM"
Date: Mon, 27 Apr 2026 22:17:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":368323170,"timestamp":1777292400000,"FTMWV_awa":3,"FTMWV_aws_knots":11,"GPGLL_latitude":41.531125,"GPGLL_longitude":-124.36994333333334,"GPVTG_cog_true":16.51,"GPVTG_sog_knots":8.18,"HEHDT_hdg_true":14.9,"IIMDA_dew_point_celsius":null,"IIMDA_humidity_relative":null,"IIMDA_pressure_millibars":1018,"IIMDA_temperature_air_celsius":9.8,"IIMDA_temperature_water_celsius":null,"IIMDA_twd_true":350.29,"IIMDA_tws_knots":9.29,"IIRSA_rudder_angle":-3.8,"SDDPT_depth_below_transducer_meters":49,"TIROT_rate_of_turn":-5.98,"WIMWV_awa":null,"WIMWV_aws_knots":null},
  {"mmsi":368323170,"timestamp":1777292460000,"FTMWV_awa":341,"FTMWV_aws_knots":14.4,"GPGLL_latitude":41.53333833333333,"GPGLL_longitude":-124.36922333333334,"GPVTG_cog_true":15.09,"GPVTG_sog_knots":8.2,"HEHDT_hdg_true":12.8,"IIMDA_dew_point_celsius":null,"IIMDA_humidity_relative":null,"IIMDA_pressure_millibars":1018,"IIMDA_temperature_air_celsius":9.8,"IIMDA_temperature_water_celsius":null,"IIMDA_twd_true":331.19,"IIMDA_tws_knots":7.89,"IIRSA_rudder_angle":-2.5,"SDDPT_depth_below_transducer_meters":46.34,"TIROT_rate_of_turn":20.05,"WIMWV_awa":null,"WIMWV_aws_knots":null}
  ]
```


This time, return the results in descending order.

```shell
curl -i --silent -X GET 'http://localhost:3001/api/v1/data/368323170?limit=2&direction=desc'

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 1141
ETag: W/"475-WykmS4yQiKr8LGwCgpBD475+OOI"
Date: Mon, 27 Apr 2026 22:12:54 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":368323170,"timestamp":1777326300000,"FTMWV_awa":301,"FTMWV_aws_knots":7.2,"GPGLL_latitude":42.047285,"GPGLL_longitude":-124.26736,"GPVTG_cog_true":40.42,"GPVTG_sog_knots":0.02,"HEHDT_hdg_true":329.2,"IIMDA_dew_point_celsius":null,"IIMDA_humidity_relative":null,"IIMDA_pressure_millibars":1020,"IIMDA_temperature_air_celsius":12.9,"IIMDA_temperature_water_celsius":null,"IIMDA_twd_true":282.29,"IIMDA_tws_knots":16.58,"IIRSA_rudder_angle":-1.7,"SDDPT_depth_below_transducer_meters":409.37,"TIROT_rate_of_turn":6.58,"WIMWV_awa":318.99,"WIMWV_aws_knots":16.39},
  {"mmsi":368323170,"timestamp":1777326240000,"FTMWV_awa":327,"FTMWV_aws_knots":7.5,"GPGLL_latitude":42.04728333333333,"GPGLL_longitude":-124.26735,"GPVTG_cog_true":245.71,"GPVTG_sog_knots":0.02,"HEHDT_hdg_true":329,"IIMDA_dew_point_celsius":null,"IIMDA_humidity_relative":null,"IIMDA_pressure_millibars":1020,"IIMDA_temperature_air_celsius":12.8,"IIMDA_temperature_water_celsius":null,"IIMDA_twd_true":305.69,"IIMDA_tws_knots":13.49,"IIRSA_rudder_angle":-1.7,"SDDPT_depth_below_transducer_meters":228.76,"TIROT_rate_of_turn":-3.27,"WIMWV_awa":327.49,"WIMWV_aws_knots":14.89}
  ]
```

Malformed query: returns HTTP 400 Bad Request

```shell
curl -i --silent -X GET 'http://localhost:3001/api/v1/data/368323170?limit=2&direction=foo' 
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 54
ETag: W/"36-PAv/eC4RlyMivMGIlAK3dSDb8Nw"
Date: Mon, 20 Apr 2026 23:55:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Invalid direction. Use \"asc\" or \"desc\""}                                                                       
```
# License & Copyright

Copyright (c) 2024-present Tom Keffer <tkeffer@gmail.com>

This source code is licensed under the MIT license found in the
LICENSE.txt file in the root directory of this source tree.

See the file LICENSE.txt for your full rights.
