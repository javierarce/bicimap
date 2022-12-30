class Stations extends Base {
  constructor (cities) {
    super()
    this.cities = cities

    const REFRESH_INTERVAL = 30 * 1000

    this.getStations()

    setInterval(() => {
      this.getStations()
    }, REFRESH_INTERVAL)
  }

  getStations () {
    console.log('getting stations')
    this.cities.forEach(this.getStationsFromCity.bind(this))
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
      const updatedAt = response.updated_at
      this.emit('data', { stations: this.stations, updatedAt })
    })
  }

  cleanAddress (address) {
    const regex = /(?:C\/ DEL|C\/ DE LA|C\/|C \/|PG\. DE|PG\.|VIA|PTGE\.|PL\.|AV\.)\s([^,\d\(]+)(?:\s\([^)]+\))?/gm
    const match = regex.exec(address)
    if (match) {
      return match[1]
    }
    return address
  }

  normalizeStationData (station, city) {
    const name = city === 'madrid' ? station.name : this.cleanAddress(station.streetName)

    return { 
      city,
      id: station.id,
      lat: station.latitude,
      lng: station.longitude,
      zoom: 17,
      ...(city === 'madrid' ? {
        name,
        address: station.address,
        mechanical: station.dock_bikes,
        bases: station.free_bases,
        bikes: station.dock_bikes,
        electric: null
      } : {
        name,
        address: station.streetName,
        mechanical: station.mechanical_bikes,
        electric: station.electrical_bikes,
        bikes: station.bikes,
        bases: station.slots
      })
    }
  }
}
