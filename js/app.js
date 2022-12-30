class App {
  constructor () {
    this.$el = document.getElementById('app')

    this.about = new About()
    this.stations = new Stations(['madrid', 'barcelona'])
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
    
    this.stations.on('data', response  => {
      this.about.setUpdatedAt(response.updatedAt)
      this.map.renderStations(response.stations)
    })
  }

  render () {
    this.map.render()
  }
}

window.onload = () => {
  new App()
}
