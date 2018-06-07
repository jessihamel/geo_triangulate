// const d3Geo = import 'd3-geo'
// const geojsonCoords = require('@mapbox/geojson-coords')
import { scaleLinear } from 'd3-scale'
import { geoContains } from 'd3-geo'
import * as geojsonCoords from '@mapbox/geojson-coords'
import { Delaunay } from 'd3-delaunay'

const longitudeScale = scaleLinear().range([-180,180])
const polePoints = [ // add vertices at poles to ensure pole stitching
  [-180, 90], [180, 90],
  [-180, -90], [180, -90]
]
const precision = 1e5

class Triangulate {
  getTriangles(mapData, nPoints) {
    const geoPoints = this.getGeoPoints(nPoints).concat(polePoints)
    const allGeoPoints = geoPoints.concat(this.cloneRight(geoPoints))
    const allTopologyPoints = geojsonCoords(mapData)
    const allPoints = allTopologyPoints.concat(
      this.cloneRight(allTopologyPoints), allGeoPoints
    ).map((p) => this.roundPoint(p)) // rounding prevents delaunay errors see https://github.com/mapbox/delaunator/issues/13


    const triangles = Delaunay.from(allPoints).triangles
    const allTriangles = []
    for (let i = 0; i < triangles.length; i += 3) {
      allTriangles.push([
        allPoints[triangles[i]],
        allPoints[triangles[i + 1]],
        allPoints[triangles[i + 2]]
      ])
    }

    //remove triangles at edges to allow for tessellation
    const filteredTriangles = allTriangles
      .filter(triangle => this.isNearSeam(triangle) === false)
    filteredTriangles.sort((a,b) => {
      return (
        Math.min.apply(null, a.map(p => p[0] > 180 ? p[0] : Infinity)) -
        Math.min.apply(null, b.map(p => p[0] > 180 ? p[0] : Infinity))
      )
    })

    // output to be populated
    const output = {
      type: 'FeatureCollection',
      features: mapData.features.map(feature => {
        return ({
          triangles: [],
          properties: feature.properties
        })
      })
    }
    // add object for empty geometry on map, allows for creation of solid spheres
    output.features.push({
      triangles: [],
      properties: {
        nullData: true
      }
    })

    this.deDupe(filteredTriangles).forEach(triangle => {
      const midPt = this.midPt(triangle)
      // assign it to the correct geometry
      const index = this.findMatchingFeatureIndex(midPt, mapData)
      if (index !== -1) {
        output.features[index].triangles.push(triangle)
      } else {
        output.features[output.features.length - 1].triangles.push(triangle)
      }
    })
    return output
  }

  /**
  * returns n uniformly distributed random points on a globe
  * see also http://mathworld.wolfram.com/SpherePointPicking.html
  * and https://www.jasondavies.com/maps/random-points/
  */
  getGeoPoints(nPoints) {
    const geoPoints = []
    for (let i = 0; i < nPoints; i++) {
      const long = longitudeScale(Math.random())
      const lat = Math.acos((2 * Math.random()) - 1) * (180 / Math.PI) - 90
      geoPoints.push([long,lat])
    }
    return geoPoints
  }

  /**
  * takes input geo geometry and duplicates it twice
  * the effect is like taking a map and copy and pasting it twice so that you
  * have three globes
  */
  cloneRight(points) {
    const map2 = points.map(p => [((p[0] * precision) + (360 * precision)) / precision, p[1]])
    const map3 = points.map(p => [((p[0] * precision) + (720 * precision)) / precision, p[1]])
    return map2.concat(map3)
  }

  roundPoint(p) {
    return [
      Math.round(p[0] * precision) / precision,
      Math.round(p[1] * precision) / precision
    ]
  }

  deDupe(triangles) {
    const uniqueTrianglesIndex = []
    const uniqueMidPts = []
    triangles.forEach((triangle, index) => {
      const midPt = this.midPt(triangle)
      const uniqueIndex = uniqueMidPts.findIndex(unique => {
        return (
          this.almostEqual(unique[0], midPt[0]) &&
          this.almostEqual(unique[1], midPt[1])
        )
      })
      if (uniqueIndex === -1) {
        uniqueTrianglesIndex.push(index)
        uniqueMidPts.push(midPt)
      }
    })
    return uniqueTrianglesIndex.map(index => triangles[index])
  }

  midPt(triangle) {
    return this.normalizePoint([
      (triangle[0][0] + triangle[1][0] + triangle[2][0]) / 3,
      (triangle[0][1] + triangle[1][1] + triangle[2][1]) / 3
    ])
  }

  isNearSeam(triangle) {
    return (
      triangle[0][0] < 0 || triangle[1][0] < 0 || triangle[2][0] < 0 ||
      triangle[0][0] > 720 || triangle[1][0] > 720 || triangle[2][0] > 720
    )
  }

  normalizePoint(p) {
    let p0 = p[0]
    while (p0 > 180) {
      p0 -= 360
    }
    return this.roundPoint([p0, p[1]])
  }

  findMatchingFeatureIndex(midPt, mapData) {
    return mapData.features.findIndex((f) => geoContains(f, midPt))
  }

  almostEqual(a, b) {
    const epsilon = 0.0001 // effing floating point precision
    return Math.abs(a - b) < epsilon
  }
}

export default new Triangulate()
