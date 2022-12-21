class App {
  constructor () {
    this.$el = document.getElementById('app')

    this.stations = new Stations()
    this.stations.getStationsFromCity('madrid')
    this.stations.getStationsFromCity('barcelona')
    this.map = new Map(COORDINATES)

    this.render()
    this.bindEvents()
  }

  bindEvents () {
    this.map.on('markerclick', (id) => {
      //this.sidebar.selectLocation(id)
    })
    
    this.stations.on('data', (stations) => {
      this.map.renderStations(stations)
    })
  }

  render () {
    this.map.render()
  }
}

window.onload = () => {
  new App()
}
