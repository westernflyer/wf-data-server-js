# NMEA data logger and server

This server subscribes to NMEA data from an MQTT broker, the writes it to an
SQLite database. It then exposes a RESTful API to retrieve the data.

## Prerequisites

* Node.js 20.18 or later
* MQTT broker (e.g. Mosquitto)

## Database schema

Sample entries from the database:

```text
mmsi|channel|timestamp|awa|aws_knots|cog_true|dew_point_celsius|hdg_true|humidity_relative|latitude|longitude|pressure_millibars|rate_of_turn|rudder_angle|sog_knots|temperature_air_celsius|temperature_water_celsius|twd_true|tws_knots|water_depth_meters
368323170|ch1|1776725880000|49.3|3.2|317.93||177.0||36.8057833333333|-121.785681666667|1012.0|2.34|-1.7|0.02|15.2||260.09|4.08|
368323170|ch2|1776725880000|54.0|5.0|||||||||||||||
368323170|ch1|1776725940000|35.6|6.18|137.05||177.2||36.805785|-121.785681666667|1012.0|0.73|-1.7|0.04|15.2||236.9|7.99|
368323170|ch2|1776725940000|49.0|7.2|||||||||||||||
368323170|ch1|1776726000000|56.1|9.29|328.37||176.8||36.805785|-121.785686666667|1012.0|-0.22|-1.7|0.04|15.2||222.49|10.98|
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
| `channel`   | string  | Limit the query to this channel, or 'all' for all channels. Default: Channel 'ch1'.                                               |
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

Ask for the default time span: all records for the last 12 hours. Because
`channel` was not specified, only `ch1` will be returned.

```shell
$  curl -i --silent -X GET 'http://localhost:3001/api/v1/data/368323170'
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 7980
ETag: W/"1f2c-o/kUA4lnoTqomGp3TMWIOJjQaQY"
Date: Mon, 16 Feb 2026 02:01:14 GMT
Connection: keep-alive
Keep-Alive: timeout=5

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 13143
ETag: W/"3357-k2smNVjinDI8CeaE4vHaGhFXY7g"
Date: Mon, 20 Apr 2026 23:46:48 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":368323170,"channel":"ch1","timestamp":1776725880000,"awa":49.3,"aws_knots":3.2,"cog_true":317.93,"dew_point_celsius":null,"hdg_true":177,"humidity_relative":null,"latitude":36.80578333333333,"longitude":-121.78568166666666,"pressure_millibars":1012,"rate_of_turn":2.34,"rudder_angle":-1.7,"sog_knots":0.02,"temperature_air_celsius":15.2,"temperature_water_celsius":null,"twd_true":260.09,"tws_knots":4.08,"water_depth_meters":null},
  {"mmsi":368323170,"channel":"ch1","timestamp":1776725940000,"awa":35.6,"aws_knots":6.18,"cog_true":137.05,"dew_point_celsius":null,"hdg_true":177.2,"humidity_relative":null,"latitude":36.805785,"longitude":-121.78568166666666,"pressure_millibars":1012,"rate_of_turn":0.73,"rudder_angle":-1.7,"sog_knots":0.04,"temperature_air_celsius":15.2,"temperature_water_celsius":null,"twd_true":236.9,"tws_knots":7.99,"water_depth_meters":null},
  {"mmsi":368323170,"channel":"ch1","timestamp":1776726000000,"awa":56.1,"aws_knots":9.29,"cog_true":328.37,"dew_point_celsius":null,"hdg_true":176.8,"humidity_relative":null,"latitude":36.805785,"longitude":-121.78568666666666,"pressure_millibars":1012,"rate_of_turn":-0.22,"rudder_angle":-1.7,"sog_knots":0.04,"temperature_air_celsius":15.2,"temperature_water_celsius":null,"twd_true":222.49,"tws_knots":10.98,"water_depth_meters":null},
  ...
]
```

Query again but limit the results to 2 records:

```shell
curl -i --silent -X GET 'http://localhost:3001/api/v1/data/368323170?limit=2'
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 875
ETag: W/"36b-QYiErNp3dFIK2icL6w1laDOnQgs"
Date: Mon, 20 Apr 2026 23:50:26 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":368323170,"channel":"ch1","timestamp":1776725880000,"awa":49.3,"aws_knots":3.2,"cog_true":317.93,"dew_point_celsius":null,"hdg_true":177,"humidity_relative":null,"latitude":36.80578333333333,"longitude":-121.78568166666666,"pressure_millibars":1012,"rate_of_turn":2.34,"rudder_angle":-1.7,"sog_knots":0.02,"temperature_air_celsius":15.2,"temperature_water_celsius":null,"twd_true":260.09,"tws_knots":4.08,"water_depth_meters":null},
  {"mmsi":368323170,"channel":"ch1","timestamp":1776725940000,"awa":35.6,"aws_knots":6.18,"cog_true":137.05,"dew_point_celsius":null,"hdg_true":177.2,"humidity_relative":null,"latitude":36.805785,"longitude":-121.78568166666666,"pressure_millibars":1012,"rate_of_turn":0.73,"rudder_angle":-1.7,"sog_knots":0.04,"temperature_air_celsius":15.2,"temperature_water_celsius":null,"twd_true":236.9,"tws_knots":7.99,"water_depth_meters":null}
]
```

Query again, but ask for all channels, 4 records:

```shell
curl -i --silent -X GET 'http://localhost:3001/api/v1/data/368323170?limit=4&channel=all'

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 1687
ETag: W/"697-YyrSJWM8EVnZeyxyqXvBI+spr4E"
Date: Mon, 20 Apr 2026 23:52:17 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":368323170,"channel":"ch1","timestamp":1776725880000,"awa":49.3,"aws_knots":3.2,"cog_true":317.93,"dew_point_celsius":null,"hdg_true":177,"humidity_relative":null,"latitude":36.80578333333333,"longitude":-121.78568166666666,"pressure_millibars":1012,"rate_of_turn":2.34,"rudder_angle":-1.7,"sog_knots":0.02,"temperature_air_celsius":15.2,"temperature_water_celsius":null,"twd_true":260.09,"tws_knots":4.08,"water_depth_meters":null},
  {"mmsi":368323170,"channel":"ch2","timestamp":1776725880000,"awa":54,"aws_knots":5,"cog_true":null,"dew_point_celsius":null,"hdg_true":null,"humidity_relative":null,"latitude":null,"longitude":null,"pressure_millibars":null,"rate_of_turn":null,"rudder_angle":null,"sog_knots":null,"temperature_air_celsius":null,"temperature_water_celsius":null,"twd_true":null,"tws_knots":null,"water_depth_meters":null},
  {"mmsi":368323170,"channel":"ch1","timestamp":1776725940000,"awa":35.6,"aws_knots":6.18,"cog_true":137.05,"dew_point_celsius":null,"hdg_true":177.2,"humidity_relative":null,"latitude":36.805785,"longitude":-121.78568166666666,"pressure_millibars":1012,"rate_of_turn":0.73,"rudder_angle":-1.7,"sog_knots":0.04,"temperature_air_celsius":15.2,"temperature_water_celsius":null,"twd_true":236.9,"tws_knots":7.99,"water_depth_meters":null},
  {"mmsi":368323170,"channel":"ch2","timestamp":1776725940000,"awa":49,"aws_knots":7.2,"cog_true":null,"dew_point_celsius":null,"hdg_true":null,"humidity_relative":null,"latitude":null,"longitude":null,"pressure_millibars":null,"rate_of_turn":null,"rudder_angle":null,"sog_knots":null,"temperature_air_celsius":null,"temperature_water_celsius":null,"twd_true":null,"tws_knots":null,"water_depth_meters":null}
]      
```

This time, return the results in descending order. Don't specify the channel, so
only `ch1` will be returned::

```shell
curl -i --silent -X GET 'http://localhost:3001/api/v1/data/368323170?limit=2&direction=desc'
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 876
ETag: W/"36c-FT1DFoqFf8GYjoaIeo5kUDELXac"
Date: Mon, 20 Apr 2026 23:54:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":368323170,"channel":"ch1","timestamp":1776729180000,"awa":46.9,"aws_knots":14,"cog_true":330.15,"dew_point_celsius":null,"hdg_true":175.8,"humidity_relative":null,"latitude":36.805785,"longitude":-121.78568166666666,"pressure_millibars":1012,"rate_of_turn":1.5,"rudder_angle":-1.7,"sog_knots":0.02,"temperature_air_celsius":15,"temperature_water_celsius":null,"twd_true":219.59,"tws_knots":13.3,"water_depth_meters":null},
  {"mmsi":368323170,"channel":"ch1","timestamp":1776729120000,"awa":39.2,"aws_knots":18.7,"cog_true":144.81,"dew_point_celsius":null,"hdg_true":176.3,"humidity_relative":null,"latitude":36.80578666666667,"longitude":-121.78569333333333,"pressure_millibars":1012,"rate_of_turn":-1.59,"rudder_angle":-1.7,"sog_knots":0.02,"temperature_air_celsius":15.1,"temperature_water_celsius":null,"twd_true":219.39,"tws_knots":16.19,"water_depth_meters":null}
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
