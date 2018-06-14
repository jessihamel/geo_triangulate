# [Geo Triangulate](https://jessihamel.github.io/geo_triangulate)

Geo Triangulate is a utility app that converts geojson files to triangles for rendering as a globe in three dimensions.

Try it [here](https://jessihamel.github.io/geo_triangulate).

Upload any [GeoJSON](http://geojson.org/) file and click "Generate Map".

Output is a GeoJSON FeatureCollection with triangle-shaped multiPolygons for each feature as well as triangles for empty areas (usually oceans or lakes).. (See below.) Triangles are encoded in two dimensions similar to longitude and latitude, but can be converted to three-dimensional cartesian coordinates for 3D rendering.

## Example output

```json
{
    "type":"FeatureCollection",
    "features": [
        {
            "type":"Feature",
            "geometry": {
                "type":"MultiPolygon",
                "coordinates":[
                    [
                        [[180,-16.06713],[180,-16.55522],[178.59684,-16.63915],[180,-16.06713]],
                        [[178.72506,-17.01204],[178.59684,-16.63915],[180,-16.55522],[178.72506,-17.01204]]
                    ]
                ]
            },
            "properties":{}
        },
        {
            "type":"Feature",
            "geometry": {
                "type":"MultiPolygon",
                "coordinates":[
                    [
                        [[177.20699,-39.14578],[177.08211,-40.13857],[176.88582,-40.06598],[177.20699,-39.14578]],
                        ...
                    ]
                ]
            },
            "properties": {
                nullData: true
            }
        },
        ...
```
