class Stations extends Base {
  constructor () {
    super()
  }

  getStationsFromCity (city) {
    return this.get(`/${city}.json`)
      .then(this.onGetStations.bind(this))
      .catch((error) => {
        console.error(error)
      })
  }

  onGetStations (response) {
    return response.json().then((response) => {
      this.stations = response.stations
      this.emit('data', this.stations)
    })
  }
}
