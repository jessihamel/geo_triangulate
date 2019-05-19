const palette = ['#d3e2b6','#bad6b4','#a1cab3','#86bfb1','#68b3af']
const colors = (index) => palette[index % palette.length]

module.exports = { colors, palette }
