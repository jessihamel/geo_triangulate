const palette = ['#D3E2B6','#C3DBB4','#AACCB1', '#87BDB1', '#68B3AF']
const colors = (index) => palette[index % palette.length]

module.exports = { colors, palette }
