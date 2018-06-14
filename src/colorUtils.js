const palette = ['#d3e2b6','#bcd6b3','#a4c9b1','#8abeb1','#68b3af']
const colors = (index) => palette[index % palette.length]

module.exports = { colors, palette }
