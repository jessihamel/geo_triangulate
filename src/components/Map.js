import React, { Component } from 'react'
import { select, selectAll } from 'd3-selection'
import { geoTransform, geoPath } from 'd3-geo'
import { colors } from '../colorUtils.js'

const height = 300

class Map extends Component {
  constructor() {
    super()
    this.mapRef = React.createRef()
  }

  componentDidMount() {
    this.updateMap()
  }

  componentDidUpdate() {
    this.updateMap()
  }

  shouldComponentUpdate(nextProps) {
    if (
      nextProps.mapData === this.props.mapData &&
      nextProps.width === this.props.width
    ) { return false }
    return true
  }

  updateMap() {
    if (this.props.triangleMap) {
      this.drawTriangleMap()
    } else {
      this.drawStandardMap()
    }
  }

  drawStandardMap() {
    const svg = select(this.mapRef.current)
    svg.selectAll('*').remove()
    const width = this.props.width
    const proj = geoTransform({
      point: function(x, y) {
        this.stream.point(
          (x * 1.5) + (width / 2),
          (y * -1.5) + (height / 2)
        )
      }
    })
    this.props.mapData.features.forEach((f, i) => {
      svg.append('path').classed('geography', true)
      .attr('d', geoPath().projection(proj)(f))
      .attr('fill', colors(i))
    })
  }

  drawTriangleMap() {
    const svg = select(this.mapRef.current)
    svg.selectAll('*').remove()
    const W1_2 = this.props.width / 2
    const H1_2 = height / 2
    this.props.mapData.features.forEach((f, i) => {
      f.triangles.forEach(t => {
        let path = 'M '
        t.forEach((c, j) => {
          j === 0 ?
            path += ((c[0] * 1.5) + W1_2 - (360 * 1.5)) + ' ' + ((c[1] * -1.5) + H1_2) + ' ':
            path += 'L ' + ((c[0] * 1.5) + W1_2 - (360 * 1.5)) + ' ' + ((c[1] * -1.5) + H1_2) + ' '
        })
        svg.append('path')
          .attr('d', path + 'Z')
          .attr('fill', f.properties.nullData ? '#ffffff' : colors(i))
      })
    })
  }

  render() {
    return (
      <div className='map'>
        <svg
          width={this.props.width}
          height={height}
          ref={this.mapRef}
        />
      </div>
    )
  }
}

export default Map
