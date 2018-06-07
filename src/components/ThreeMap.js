import React, { Component } from 'react'
import { Scene, PerspectiveCamera, WebGLRenderer, PointLight, AmbientLight, Geometry, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, Vector3, Face3, BackSide, Group } from 'three'
import { colors } from '../colorUtils.js'

const height = 300
const convertCartesian = (point) => {
  //https://bl.ocks.org/mbostock/2b85250396c17a79155302f91ec21224
  const radius = 1
  var lambda = point[0] * Math.PI / 180,
    phi = point[1] * Math.PI / 180,
    cosPhi = Math.cos(phi)
  return new Vector3(
    radius * cosPhi * Math.cos(lambda),
    radius * cosPhi * Math.sin(lambda),
    radius * Math.sin(phi)
  )
}

class ThreeMap extends Component {
  constructor() {
    super()
    this.containerRef = React.createRef()
    this.animate = this.animate.bind(this)
  }

  componentDidMount() {
    this.scene = new Scene()
    this.camera = new PerspectiveCamera( 75, this.props.width / height, 0.1, 1000 )
    this.camera.position.z = 2
    this.renderer = new WebGLRenderer()
    this.renderer.setSize( this.props.width, height )
    this.renderer.setClearColor( 0xFFFFFF, 1 )
    this.containerRef.current.appendChild( this.renderer.domElement )
    this.addLights()
    this.createMap()
    this.animate()
  }

  componentDidUpdate() {
    this.cleanMapGroup()
    this.createMap()
  }

  addLights() {
    var lights = [
      new PointLight( 0xffffff, 0.4, 0 ),
      new PointLight( 0xffffff, 0.2, 0 ),
      new PointLight( 0xffffff, 0.6, 0 ),
      new PointLight( 0xffffff, 0.6, 0 )
    ]
    lights[ 0 ].position.set( 0, 200, 0 )
    lights[ 1 ].position.set( 100, 200, 100 )
    lights[ 2 ].position.set( - 100, - 200, - 100 )
    lights[ 3 ].position.set( -10, 20, 20 )

    this.scene.add( lights[ 0 ] )
    this.scene.add( lights[ 1 ] )
    this.scene.add( lights[ 2 ] )
    this.scene.add( lights[ 3 ] )
    this.scene.add( new AmbientLight( 0x404040 ) ) // soft white light
  }

  createPhysicalMaterial(f, i) {
    return new MeshPhysicalMaterial({
      color: f.properties.nullData ? 0xFFFFFF : colors(i),
      roughness: 1,
      metalness: 0.1,
      reflectivity: 0.1
    })
  }

  createBasicMaterial(f, i) {
    return new MeshBasicMaterial({
      color: f.properties.nullData ? 0xe7e7e7 : colors(i),
    })
  }

  createMap() {
    const mapMeshes = this.props.mapData.features.map((f, i) => {
      const featureGeometry = new Geometry()
      const featureMaterial = this.props.material === 'basic' ?
        this.createBasicMaterial(f, i) :
        this.createPhysicalMaterial(f, i)
      f.triangles.forEach(t => {
        t.forEach(v => {
          featureGeometry.vertices.push(convertCartesian(v))
        })
        const vertexLength = featureGeometry.vertices.length
        featureGeometry.faces.push(
          new Face3(
            vertexLength - 3, vertexLength - 2, vertexLength - 1
          )
        )
      })
      featureMaterial.side = BackSide
      featureGeometry.computeFaceNormals()
      featureGeometry.computeVertexNormals()
      return new Mesh( featureGeometry, featureMaterial )
    })
    this.mapGroup = new Group()
    mapMeshes.forEach((mesh) => {
      this.mapGroup.add(mesh)
    })
    this.mapGroup.rotation.x = -Math.PI / 2
    this.scene.add(this.mapGroup)
  }

  cleanMapGroup() {
    this.scene.remove(this.mapGroup)
  }

  animate() {
    requestAnimationFrame( this.animate )
    this.mapGroup.rotation.z += 0.003
    this.renderer.render( this.scene, this.camera )
  }

  render() {
    return (
      <div className='three-map' ref={this.containerRef}>
      </div>
    )
  }
}

export default ThreeMap
