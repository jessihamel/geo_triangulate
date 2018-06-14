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
      .attr('fill', f.properties.nullData ? '#ffffff' : colors(i))
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
