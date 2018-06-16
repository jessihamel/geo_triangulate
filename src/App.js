import React, { Component } from 'react'
import * as geoNormalize from '@mapbox/geojson-normalize'
import * as geoFlatten from 'geojson-flatten'
import Map from './components/Map'
import ThreeMap from './components/ThreeMap'
import Loading from './components/Loading'
import worldMap from './maps/world_simple.json'
import triangleMap from './maps/world_triangles.json'
import TriangulateWorker from './triangulate.worker.js'
import { palette } from './colorUtils.js'
import { debounce } from './utils.js'
const minComplexity = 0
const maxComplexity = 2500
const defaultComplexity = 500

class App extends Component {
  constructor() {
    super()
    this.state = {
      width: window.innerWidth,
      map: geoFlatten(geoNormalize(worldMap)),
      complexity: defaultComplexity,
      triangleMap,
      loading: false,
    }
    this.initWorker()

    this.uploadRef = React.createRef()
    this.openUpload = this.openUpload.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.download = this.download.bind(this)
    this.onChangeSlider = this.onChangeSlider.bind(this)
    this.calculateTriangles = debounce(this.calculateTriangles.bind(this), 1000)
    this.onResize = debounce(this.onResize, 500)
    window.onresize = this.onResize.bind(this)
  }

  initWorker() {
    this.triangulateWorker = new TriangulateWorker()
    this.triangulateWorker.onmessage = (e) => {
      this.setState({
        triangleMap: e.data,
        loading: false,
      })
    }
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
      this.setState({map, loading: true})
      this.triangulateWorker.postMessage({
        mapData : map,
        complexity: this.state.complexity
      })
    }
    reader.readAsText(f, 'UTF-8')
  }

  onChangeSlider(event) {
    const complexity = event.target.value
    this.setState({complexity})
  }

  calculateTriangles() {
    if (this.state.loading) {
      return
    }
    this.setState({loading: true})
    this.triangulateWorker.postMessage({
      mapData : this.state.map,
      complexity: this.state.complexity
    })
  }

  download() {
    const link = document.createElement('a')
    document.body.appendChild(link)
    link.setAttribute('href', this.getDownloadURL())
    link.setAttribute('download', 'triangles.json')
    link.click()
    document.body.removeChild(link)
  }

  getDownloadURL() {
    const blob = new Blob(
      [JSON.stringify(this.state.triangleMap)],
      {type: 'text/json'}
    )
    return URL.createObjectURL(blob)
  }

  render() {
    return (
      <div className='App'>
        <header style={{background: palette[4]}}>
          <div>
            <h1 className='title'>Geo Triangulate</h1>
            <h2>convert geoJSON to triangles for 3d rendering</h2>
          </div>
          <div>
            <a href='https://github.com/jessihamel/geo_triangulate'>documentation</a>
          </div>
        </header>
        <div className='step'>
          <div className='step-header' style={{background: palette[3], borderTop: 'none'}}>
            Map
          </div>
        </div>
        <div className='ui'>
          <div className='button' onClick={this.openUpload}>Upload geoJSON</div>
          <input
            type='file'
            style={{ display: 'none' }}
            accept='.json'
            ref={this.uploadRef}
            onChange={this.handleUpload} />
          <div className='button' onClick={this.download}>
            Download triangles
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
        <div className='slider-ui'>
          <span>Complexity</span>
          <input
            type='range'
            min={minComplexity}
            max={maxComplexity}
            value={this.state.complexity}
            className='slider'
            onChange={this.onChangeSlider}
          />
          <div className='button'
            style={{
              opacity: this.state.loading ? 0.2 : 1,
              pointerEvents: this.state.loading ? 'none' : 'auto'
            }}
            onClick={this.calculateTriangles}
          >Generate Map</div>
        </div>
        <div style={{position: 'relative'}}>
          <Loading loading={this.state.loading} />
          <Map
            width={this.state.width}
            mapData={this.state.triangleMap} />
        </div>
        <div className='step'>
          <div className='step-header' style={{background: palette[1]}}>
            3D: Reflective Material
          </div>
        </div>
        <div className='instruction'>click and drag to rotate globe</div>
        <div style={{position: 'relative'}}>
          <Loading loading={this.state.loading} />
          <ThreeMap
            width={this.state.width}
            mapData={this.state.triangleMap} />
        </div>
        <div className='step'>
          <div className='step-header' style={{background: palette[1]}}>
            3D: Basic Material
          </div>
        </div>
        <div style={{position: 'relative'}}>
          <Loading loading={this.state.loading} />
          <ThreeMap
            width={this.state.width}
            mapData={this.state.triangleMap}
            material='basic' />
        </div>
      </div>
    );
  }
}

export default App
