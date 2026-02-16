

## API

### Get records

Return all records within a given time span

```
GET /api/v1/data
```

**Parameters**

| *Name*      | *Type*  | *Description*                                                                                                                     |
|:------------|:--------|:----------------------------------------------------------------------------------------------------------------------------------|
| `start`     | integer | All records greater than this timestamp in milliseconds will be included in the results. Default: one hour before present time.   |
| `end`       | integer | All records less than or equal to this timestamp in milliseconds will be included in the results. Default: last available record. |
| `limit`     | integer | Limit the number of returned packets to this value. Default: no limit.                                                            |
| `direction` | string  | The direction of the sort. Can be either `asc` or `desc`. Default: `asc`.                                                         |


**Response code**

| *Status* | *Meaning*             |
|:---------|:----------------------|
| 200      | Success               |
| 400      | Malformed query       |

**Examples**

Ask for the default time span: all records for the last one hour.

```shell
$  curl -i --silent -X GET 'http://localhost:3001/api/v1/data'
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 7980
ETag: W/"1f2c-o/kUA4lnoTqomGp3TMWIOJjQaQY"
Date: Mon, 16 Feb 2026 02:01:14 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":"368323170","timestamp":1771206120000,"awa":224.79,"aws_knots":1.4,"cog_true":9.53,"dew_point_celsius":null,"hdg_true":177.9,"humidity_relative":null,"latitude":36.805775,"longitude":-121.785685,"pressure_millibars":1010,"rate_of_turn":0.79,"rudder_angle":-1.9,"sog_knots":0,"temperature_air_celsius":12,"temperature_water_celsius":null,"twd_true":28.3,"tws_knots":1.59,"water_depth_meters":1.66},
  {"mmsi":"368323170","timestamp":1771206180000,"awa":261.49,"aws_knots":2.39,"cog_true":217.78,"dew_point_celsius":null,"hdg_true":178.4,"humidity_relative":null,"latitude":36.80578,"longitude":-121.78568833333334,"pressure_millibars":1010,"rate_of_turn":3.38,"rudder_angle":-1.9,"sog_knots":0.02,"temperature_air_celsius":12,"temperature_water_celsius":null,"twd_true":78.99,"tws_knots":1.98,"water_depth_meters":1.64},
  {"mmsi":"368323170","timestamp":1771206240000,"awa":283.29,"aws_knots":1.4,"cog_true":162.75,"dew_point_celsius":null,"hdg_true":177.9,"humidity_relative":null,"latitude":36.80578166666667,"longitude":-121.78567833333334,"pressure_millibars":1010,"rate_of_turn":5.9,"rudder_angle":-1.9,"sog_knots":0.04,"temperature_air_celsius":12.1,"temperature_water_celsius":null,"twd_true":64.89,"tws_knots":1.09,"water_depth_meters":1.75},
  {"mmsi":"368323170","timestamp":1771206300000,"awa":-5.8,"aws_knots":4,"cog_true":221.68,"dew_point_celsius":null,"hdg_true":178.2,"humidity_relative":null,"latitude":36.80578166666667,"longitude":-121.78568666666666,"pressure_millibars":1010,"rate_of_turn":4.19,"rudder_angle":-2,"sog_knots":0.02,"temperature_air_celsius":12.1,"temperature_water_celsius":null,"twd_true":167.49,"tws_knots":2.99,"water_depth_meters":1.66},
  {"mmsi":"368323170","timestamp":1771206360000,"awa":4,"aws_knots":3.6,"cog_true":115.41,"dew_point_celsius":null,"hdg_true":178.1,"humidity_relative":null,"latitude":36.80578666666667,"longitude":-121.78568833333334,"pressure_millibars":1010,"rate_of_turn":-5.05,"rudder_angle":-1.9,"sog_knots":0.04,"temperature_air_celsius":12.1,"temperature_water_celsius":null,"twd_true":244.69,"tws_knots":2.29,"water_depth_meters":1.66},
  ...
]      
```

Query again but limit the results to 2 records:

```shell
curl -i --silent -X GET 'http://localhost:3001/api/v1/data?limit=2'
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 825
ETag: W/"339-rwCaBg7bk+nXhXhmxVqVwjF/JAU"
Date: Mon, 16 Feb 2026 02:09:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":"368323170","timestamp":1771206120000,"awa":224.79,"aws_knots":1.4,"cog_true":9.53,"dew_point_celsius":null,"hdg_true":177.9,"humidity_relative":null,"latitude":36.805775,"longitude":-121.785685,"pressure_millibars":1010,"rate_of_turn":0.79,"rudder_angle":-1.9,"sog_knots":0,"temperature_air_celsius":12,"temperature_water_celsius":null,"twd_true":28.3,"tws_knots":1.59,"water_depth_meters":1.66},
  {"mmsi":"368323170","timestamp":1771206180000,"awa":261.49,"aws_knots":2.39,"cog_true":217.78,"dew_point_celsius":null,"hdg_true":178.4,"humidity_relative":null,"latitude":36.80578,"longitude":-121.78568833333334,"pressure_millibars":1010,"rate_of_turn":3.38,"rudder_angle":-1.9,"sog_knots":0.02,"temperature_air_celsius":12,"temperature_water_celsius":null,"twd_true":78.99,"tws_knots":1.98,"water_depth_meters":1.64}
]    
```

This time, return the results in descending order:

```shell
curl -i --silent -X GET 'http://localhost:3001/api/v1/data?limit=2&direction=desc'
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 828
ETag: W/"33c-ibZeUqlRq84477Jg7s/RnW5C2m4"
Date: Mon, 16 Feb 2026 22:03:19 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[
  {"mmsi":"368323170","timestamp":1771279320000,"awa":124.3,"aws_knots":7.1,"cog_true":258.57,"dew_point_celsius":null,"hdg_true":178.3,"humidity_relative":null,"latitude":36.80579,"longitude":-121.78567833333334,"pressure_millibars":1002.9999999999999,"rate_of_turn":0.15,"rudder_angle":-2,"sog_knots":0.02,"temperature_air_celsius":8.7,"temperature_water_celsius":null,"twd_true":313.49,"tws_knots":7.19,"water_depth_meters":1.88},
  {"mmsi":"368323170","timestamp":1771279260000,"awa":115.9,"aws_knots":5.3,"cog_true":null,"dew_point_celsius":null,"hdg_true":null,"humidity_relative":null,"latitude":null,"longitude":null,"pressure_millibars":null,"rate_of_turn":0.97,"rudder_angle":null,"sog_knots":null,"temperature_air_celsius":null,"temperature_water_celsius":null,"twd_true":null,"tws_knots":null,"water_depth_meters":1.93}
]    
```


# License & Copyright

Copyright (c) 2025–2026 Tom Keffer <tkeffer@gmail.com>

See the file LICENSE for your full rights.
