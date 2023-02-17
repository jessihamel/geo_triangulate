import { scaleLinear } from "d3-scale";
import { geoContains } from "d3-geo";
import * as geojsonCoords from "@mapbox/geojson-coords";
import { geoVoronoi } from "d3-geo-voronoi";

const longitudeScale = scaleLinear().range([-180, 180]);

class Triangulate {
  getTriangles(mapData, nPoints, interpolation, postMessageCb) {
    const geoPoints =
      interpolation === "random" ? this.getGeoPoints(nPoints) : this.getGeoPointsSpiral(nPoints);
    const allTopologyPoints = geojsonCoords(mapData);
    const uniqueTopologyPoints = []; // need uniques to prevent geoVoronoi issues
    allTopologyPoints.concat(geoPoints).forEach((p) => {
      const idx = uniqueTopologyPoints.findIndex((p1) => {
        return p1[0] == p[0] && p1[1] == p[1];
      });
      if (idx === -1) {
        uniqueTopologyPoints.push(p);
      }
    });
    const voronoiTriangles = geoVoronoi().triangles(uniqueTopologyPoints);
    const allTriangles = [];
    voronoiTriangles.features.forEach((feature) => {
      allTriangles.push({
        coords: [
          this.roundPoint(feature.geometry.coordinates[0][0]),
          this.roundPoint(feature.geometry.coordinates[0][1]),
          this.roundPoint(feature.geometry.coordinates[0][2]),
        ],
        circumcenter: feature.properties.circumcenter,
      });
    });

    // output to be populated
    const output = {
      type: "FeatureCollection",
      features: mapData.features.map((feature) => {
        return {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: [[]],
          },
          properties: feature.properties,
        };
      }),
    };
    // add object for empty geometry on map, allows for creation of solid spheres
    output.features.push({
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: [[]],
      },
      properties: {
        nullData: true,
      },
    });

    allTriangles.forEach((triangle, i) => {
      if (i % 500 === 0) {
        postMessageCb({ progress: i / allTriangles.length });
      }
      const midPt = triangle.circumcenter;
      // assign it to the correct geometry
      const index = this.findMatchingFeatureIndex(midPt, mapData);
      const trianglePolygon = triangle.coords.map((p) => p);
      trianglePolygon.push(triangle.coords[0]); // add first coord again for valid geojson
      if (index !== -1) {
        output.features[index].geometry.coordinates[0].push(trianglePolygon);
      } else {
        output.features[output.features.length - 1].geometry.coordinates[0].push(trianglePolygon);
      }
    });
    return output;
  }

  /**
   * returns n uniformly distributed random points on a globe
   * see also http://mathworld.wolfram.com/SpherePointPicking.html
   * and https://www.jasondavies.com/maps/random-points/
   * TODO: implement Poisson-disc sampling for more even distribution
   */
  getGeoPoints(nPoints) {
    const geoPoints = [];
    for (let i = 0; i < nPoints; i++) {
      const long = longitudeScale(Math.random());
      const lat = Math.acos(2 * Math.random() - 1) * (180 / Math.PI) - 90;
      geoPoints.push([long, lat]);
    }
    return geoPoints;
  }

  /**
   * https://beta.observablehq.com/@mbostock/spherical-fibonacci-lattice
   */
  getGeoPointsSpiral(nPoints) {
    const geoPoints = [];
    const phi = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < nPoints; i++) {
      const [x, y] = [i / phi, i / nPoints];
      geoPoints.push([(x * 360) % 360, (Math.acos(2 * y - 1) / Math.PI) * 180 - 90]);
    }
    return geoPoints;
  }

  findMatchingFeatureIndex(midPt, mapData) {
    return mapData.features.findIndex((f) => geoContains(f, midPt));
  }

  roundPoint(p) {
    const precision = 1e5;
    return [Math.round(p[0] * precision) / precision, Math.round(p[1] * precision) / precision];
  }
}

export default new Triangulate();
