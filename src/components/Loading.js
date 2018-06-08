import React, { Component } from 'react'

export default (props) => {
  const style = {
    display: props.loading ? 'block' : 'none',
    background: props.loading ? 'rgba(255,255,255,0.6)' : 'none',
    height: '100%',
    width: '100%',
    position: 'absolute'
  }
  return (
    <div style={style}>
      <div className='loading'>Calculating...</div>
    </div>
  )
}
