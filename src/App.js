import React, { Component } from 'react'
import * as geoNormalize from '@mapbox/geojson-normalize'
import * as geoFlatten from 'geojson-flatten'
import Map from './components/Map'
import ThreeMap from './components/ThreeMap'
import Loading from './components/Loading'
import worldMap from './maps/world_simple.json'
import triangleMap from './maps/world_triangles.json'
import TriangulateWorker from './triangulate.worker.js'
import { debounce } from './utils.js'
import { geoStitch } from 'd3-geo-projection'
const minComplexity = 0
const maxComplexity = 2500
const defaultComplexity = 500

class App extends Component {
  constructor() {
    super()
    this.state = {
      width: window.innerWidth,
      map: this.normalizeAndStitch(worldMap),
      complexity: defaultComplexity,
      triangleMap,
      loading: false,
      interpolation: 'random'
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

  normalizeAndStitch(map) {
    return geoFlatten(geoNormalize(geoStitch(map)))
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
      const map = this.normalizeAndStitch(mapJson)
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
      complexity: this.state.complexity,
      interpolation: this.state.interpolation,
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
        <header>
          <div>
            <h1 className='title'>Geo Triangulate</h1>
            <h2>convert geoJSON to triangles for 3d rendering</h2>
          </div>
          <div>
            <a href='https://github.com/jessihamel/geo_triangulate'>documentation</a>
          </div>
        </header>
        <div className='step'>
          <div className='step-header' style={{borderTop: 'none'}}>
            UPLOAD
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
        </div>
        <Map
          width={this.state.width}
          mapData={this.state.map} />
        <div className='border' />
        <div className='step'>
          <div className='step-header'>
            EDIT
          </div>
        </div>
        <div className='slider-ui'>
          <div className='input-wrapper'>
            <div style={{paddingRight: '16px'}}>
              <div className='wrapper-header'>Interpolation</div>
              <div>
                <label>
                  <input
                    type="radio"
                    value="random"
                    checked={this.state.interpolation === 'random'}
                    onChange={() => this.setState({interpolation: 'random'})}
                  />
                  Random
                </label>
                <label>
                  <input
                    type="radio"
                    value="fibonacci"
                    checked={this.state.interpolation === 'fib'}
                    onChange={() => this.setState({interpolation: 'fib'})}
                  />
                  Fibonacci
                </label>
              </div>
            </div>
            <div>
              <div className='wrapper-header'>Complexity</div>
              <div>
                <input
                  type='range'
                  min={minComplexity}
                  max={maxComplexity}
                  value={this.state.complexity}
                  className='slider'
                  onChange={this.onChangeSlider}
                />
              </div>
            </div>
          </div>
          <div className='input-wrapper'>
            <div className='button'
              style={{
                opacity: this.state.loading ? 0.2 : 1,
                pointerEvents: this.state.loading ? 'none' : 'auto'
              }}
              onClick={this.calculateTriangles}
            >Generate Map</div>
          </div>
        </div>
        <div style={{position: 'relative'}}>
          <Loading loading={this.state.loading} />
          <Map
            width={this.state.width}
            mapData={this.state.triangleMap} />
        </div>
        <div className='border' />
        <div className='step'>
          <div className='step-header'>
            Review and Download
          </div>
        </div>
        <div className='input-wrapper'>
          <div className='button' onClick={this.download}>
            Download triangles
          </div>
        </div>
        <div className='instruction'>
          <div>(click and drag to rotate globe)</div>
        </div>
        <div className='material'>
          3d: Reflective Material
        </div>
        <div style={{position: 'relative'}}>
          <Loading loading={this.state.loading} />
          <ThreeMap
            width={this.state.width}
            mapData={this.state.triangleMap} />
        </div>
        <div className='material'>
          3d: Basic Material
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
