import React, { Component } from 'react'
import * as geoNormalize from '@mapbox/geojson-normalize'
import * as geoFlatten from 'geojson-flatten'
import Map from './components/Map'
import ThreeMap from './components/ThreeMap'
import worldMap from './maps/world_simple.json'
import triangleMap from './maps/world_triangles.json'
import Triangulate from './triangulate.js'
import { palette } from './colorUtils.js'
import { debounce } from './utils.js'
const minComplexity = 0
const maxComplexity = 1000
const defaultComplexity = 500

class App extends Component {
  constructor() {
    super()
    this.state = {
      width: window.innerWidth,
      map: geoFlatten(geoNormalize(worldMap)),
      complexity: defaultComplexity,
      triangleMap,
    }
    this.uploadRef = React.createRef()
    this.openUpload = this.openUpload.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.onChangeSlider = this.onChangeSlider.bind(this)
    this.calculateTriangles = debounce(this.calculateTriangles)
    window.onresize = this.onResize.bind(this)
  }

  onResize() {
    this.setWidth()
  }

  setWidth() {
    this.setState({
      width: window.innerWidth,
    })
  }

  openUpload() {
    this.uploadRef.current.click()
  }

  handleUpload(event) {
    const f = event.target.files[0]
    const reader = new FileReader()
    reader.onload = e => {
      const mapJson = JSON.parse(reader.result)
      const map = geoFlatten(geoNormalize(mapJson))
      this.setState({map})
      const triangleMap = Triangulate.getTriangles(map, this.state.complexity)
      this.setState({triangleMap})
    }
    reader.readAsText(f, 'UTF-8')
  }

  onChangeSlider(event) {
    const complexity = event.target.value
    this.setState({complexity})
    this.calculateTriangles(this.state.map, complexity)
  }

  calculateTriangles(map, complexity) {
    const triangleMap = Triangulate.getTriangles(map, complexity)
    this.setState({triangleMap})
  }

  render() {
    return (
      <div className='App'>
        <header style={{background: palette[4]}}>
          <h1 className='title'>Geo Triangulate</h1>
          <h2>convert geojson to triangles for 3d rendering</h2>
        </header>
        <div className='ui'>
          <div className='button' onClick={this.openUpload}>Upload geojson</div>
          <input
            type='file'
            ref='input'
            style={{ display: 'none' }}
            accept='.json'
            ref={this.uploadRef}
            onChange={this.handleUpload} />
          <div className='button' onClick={this.download}>
            <a href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(this.state.triangleMap))}`} download="triangles.json">Download triangles</a>
          </div>
        </div>
        <div className='step'>
          <div className='step-header' style={{background: palette[3]}}>
            Map
          </div>
        </div>
        <Map
          width={this.state.width}
          mapData={this.state.map} />
        <div className='step'>
          <div className='step-header' style={{background: palette[2]}}>
            Triangles
          </div>
        </div>
        <input
          type='range'
          min={minComplexity}
          max={maxComplexity}
          value={this.state.complexity}
          className='slider'
          onChange={this.onChangeSlider}
        />
        <Map
          width={this.state.width}
          mapData={this.state.triangleMap}
          triangleMap={true} />
        <div className='step'>
          <div className='step-header' style={{background: palette[1]}}>
            3D: Reflective Material
          </div>
        </div>
        <ThreeMap
          width={this.state.width}
          mapData={this.state.triangleMap} />
        <div className='step'>
          <div className='step-header' style={{background: palette[1]}}>
            3D: Basic Material
          </div>
        </div>
        <ThreeMap
          width={this.state.width}
          mapData={this.state.triangleMap}
          material='basic' />
      </div>
    );
  }
}

export default App
