# [Geo Triangulate](https://jessihamel.github.io/geo_triangulate)

Geo Triangulate is a utility app that converts geojson files to triangles for rendering as a globe in three dimensions. It relies heavily on the awesome [d3-geo-voronoi](https://github.com/Fil/d3-geo-voronoi) to calculate triangles.

Try it [here](https://jessihamel.github.io/geo_triangulate).

Upload any [GeoJSON](http://geojson.org/) file and click "Generate Map".

Output is a GeoJSON FeatureCollection with triangle-shaped multiPolygons for each feature as well as an additional feature for empty areas--usually oceans or lakes. Triangles are encoded in two dimensions similar to longitude and latitude, but can be converted to three-dimensional cartesian coordinates for 3D rendering.

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
              "nullData": true
          }
      },
      ...
  ]
}
```

## Rendering in THREE.js

See the [examples file](https://github.com/jessihamel/geo_triangulate/tree/master/examples) for a full example of how to render in three.js.

## Troubleshooting

Highly detailed maps may take a while to calculate. Consider simplifying your file before uploading. I reccommend using the superb [mapshaper](https://mapshaper.org/) tool; however be sure to include the `gj2008` flag before downloading to ensure compatibility. For more info see [here](https://github.com/mbloch/mapshaper/issues/432).
