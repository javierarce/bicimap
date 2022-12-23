class Stations extends Base {
  constructor () {
    super()
  }

  getStationsFromCity (city) {
    return this.get(`/${city}.json`)
      .then((response) => {
        this.onGetStations(response, city)
      }).catch((error) => {
        console.error(error)
      })
  }

  onGetStations (response, city) {
    return response.json().then((response) => {
      this.stations = response.stations.map(station => this.normalizeStationData(station, city))
      this.emit('data', this.stations)
    })
  }

  normalizeStationData (station, city) {
    return { 
      city,
      id: station.id,
      lat: station.latitude,
      lng: station.longitude,
      zoom: 17,
      ...(city === 'madrid' ? {
        name: station.name,
        address: station.address,
        mechanical: station.dock_bikes,
        bases: station.free_bases,
        bikes: station.dock_bikes,
        electric: null
      } : {
        name: station.streetName,
        address: station.streetName,
        mechanical: station.mechanical_bikes,
        electric: station.electrical_bikes,
        bikes: station.bikes,
        bases: station.slots
      })
    }
  }
}
