class App {
  constructor () {
    this.$el = document.getElementById('app')

    this.about = new About()
    this.stations = new Stations()
    this.stations.getStationsFromCity('madrid')
    this.stations.getStationsFromCity('barcelona')
    this.map = new Map(COORDINATES)

    this.render()
    this.bindEvents()
  }

  bindEvents () {
    this.map.on('start-loading', () => {
      document.body.classList.add('is-loading')
    })

    this.map.on('stop-loading', () => {
      document.body.classList.remove('is-loading')
    })

    this.map.on('show-about', () => {
      this.about.show()
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
