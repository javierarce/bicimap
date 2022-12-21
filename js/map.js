class Map extends Base {
  constructor (coordinates) {
    super()
    this.coordinates = coordinates
    this.tileLayer = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}'
    this.attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'

    this.options = { 
      scrollWheelZoom: true,
      zoomControl: true,
      maxBoundsViscosity: 1.0
    }
  }

  renderStations (stations) {
    stations.reverse().forEach(this.addMarker.bind(this)) 
    //this.map.addLayer(this.cluster)
  }

  flattenCoordinates (coordinates) {
    return [coordinates.lat, coordinates.lng]
  }

  addMarker (station) {
    console.log(station)

    const coordinates = { lat: station.latitude, lng: station.longitude }
    const name = station.name
    const description = station.description
    const user = station.user
    const address = station.address
    const zoom = this.map.getZoom()

    const icon = this.getIcon({ station })

    const latlng = this.flattenCoordinates(coordinates) 
    const marker = L.marker(latlng, { icon, station })

    this.cluster.addLayer(marker)

    marker.on('click', () => {
      this.emit('markerclick', station.id)
    })

    this.map.addLayer(this.cluster)
  }

  selectMarker (data) {
    const latlng = this.flattenCoordinates({ lat: data.lat, lng: data.lng })
    this.map.setView(latlng, 16)
  }

  getIcon ({ station, className }) {
    return new L.divIcon({
      className: 'Marker',
      iconSize: [32, 32],
      iconAnchor: new L.Point(16, 0)
    })
  }

  render () {
    const attribution = this.attribution

    this.map = L.map('map', this.options).setView([this.coordinates.lat, this.coordinates.lng], this.coordinates.zoom)

    this.cluster = L.markerClusterGroup({
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      iconCreateFunction: function (cluster) {
        return L.divIcon({
          className: "Cluster",
          html: '<div>' + cluster.getChildCount() + '</div>',
          iconSize: [32, 32],
          iconAnchor: new L.Point(16, 0)
        })
      }
    })

    L.tileLayer(this.tileLayer+ (L.Browser.retina ? '@2x.png' : '.png'), {
      attribution,
      subdomains: 'abcd',
      maxZoom: 20,
      minZoom: 0
    }).addTo(this.map)
  }
}
