import Triangulate from './triangulate'

onmessage = function(e) {
  const triangulated = Triangulate.getTriangles(
    e.data.mapData,
    e.data.complexity
  )
  postMessage(triangulated)
}
