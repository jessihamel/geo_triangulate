import React, { Component } from 'react'
import { colors } from '../colorUtils.js'

const THREE = window.THREE

const height = 300
const convertCartesian = (point) => {
  //https://bl.ocks.org/mbostock/2b85250396c17a79155302f91ec21224
  const radius = 1
  var lambda = point[0] * Math.PI / 180,
    phi = point[1] * Math.PI / 180,
    cosPhi = Math.cos(phi)
  return new THREE.Vector3(
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
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera( 75, this.props.width / height, 0.1, 1000 )
    this.camera.position.z = 2
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize( this.props.width, height )
    this.renderer.setClearColor( 0xFFFFFF, 1 )
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement )
    this.controls.enableZoom = false
    this.containerRef.current.appendChild( this.renderer.domElement )
    this.addLights()
    this.createMap()
    this.animate()
  }

  componentDidUpdate() {
    this.updateDimensions()
    this.cleanMapGroup()
    this.createMap()
  }

  shouldComponentUpdate(nextProps) {
    if (
      nextProps.mapData === this.props.mapData &&
      nextProps.width === this.props.width
    ) { return false }
    return true
  }

  updateDimensions() {
    this.camera.aspect = this.props.width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize( this.props.width, height )
  }

  addLights() {
    var lights = [
      new THREE.PointLight( 0xffffff, 0.4, 0 ),
      new THREE.PointLight( 0xffffff, 0.4, 0 ),
      new THREE.PointLight( 0xffffff, 0.4, 0 ),
      new THREE.PointLight( 0xffffff, 0.4, 0 )
    ]
    lights[ 0 ].position.set( 0, 20, 0 )
    lights[ 1 ].position.set( 10, 20, 10 )
    lights[ 2 ].position.set( -10, -20, - 10 )
    lights[ 3 ].position.set( -10, 20, 20 )

    this.scene.add( lights[ 0 ] )
    this.scene.add( lights[ 1 ] )
    this.scene.add( lights[ 2 ] )
    this.scene.add( lights[ 3 ] )
    this.scene.add( new THREE.AmbientLight( 0x404040 ) ) // soft white light
  }

  createPhysicalMaterial(f, i) {
    return new THREE.MeshPhysicalMaterial({
      color: f.properties.nullData ? 0xFFFFFF : colors(i),
      roughness: 1,
      metalness: 0.1,
      reflectivity: 0.1
    })
  }

  createBasicMaterial(f, i) {
    return new THREE.MeshBasicMaterial({
      color: f.properties.nullData ? 0xe7e7e7 : colors(i),
    })
  }

  createMap() {
    const mapMeshes = this.props.mapData.features.map((f, i) => {
      const featureGeometry = new THREE.Geometry()
      const featureMaterial = this.props.material === 'basic' ?
        this.createBasicMaterial(f, i) :
        this.createPhysicalMaterial(f, i)
      f.geometry.coordinates[0].forEach(t => {
        t.slice(0,3).map(v => {
          return featureGeometry.vertices.push(convertCartesian(v))
        })
      })
      for (var j = 0; j < featureGeometry.vertices.length; j += 3) {
        featureGeometry.faces.push(new THREE.Face3(j, j + 1, j + 2))
      }
      featureMaterial.side = THREE.BackSide
      featureGeometry.computeFaceNormals()
      featureGeometry.computeVertexNormals()
      return new THREE.Mesh( featureGeometry, featureMaterial )
    })
    this.mapGroup = new THREE.Group()
    mapMeshes.forEach((mesh) => {
      this.mapGroup.add(mesh)
    })
    this.mapGroup.rotation.x = -Math.PI / 2
    this.scene.add(this.mapGroup)
  }

  cleanMapGroup() {
    this.scene.remove(this.mapGroup)
    this.mapGroup.children.forEach(child => {
      child.geometry.dispose()
      child.material.dispose()
    })
  }

  animate() {
    requestAnimationFrame( this.animate )
    this.mapGroup.rotation.z += 0.003
    this.controls.update()
    this.renderer.render( this.scene, this.camera )
  }

  render() {
    return (
      <div className='three-map' ref={this.containerRef} />
    )
  }
}

export default ThreeMap
