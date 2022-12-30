const MODE_BIKES = 'bikes'
const MODE_BASES = 'bases'
const MADRID_BOUNDS = L.latLngBounds(L.latLng(40.52663416373108, -3.7968269716076013), L.latLng(40.318012406610876, -3.572241580290972))
const BARCELONA_BOUNDS = L.latLngBounds(L.latLng(41.46601766304985, 2.0719888007174037), L.latLng(41.32810027799218, 2.238855829258895))

class Map extends Base {
  constructor (coordinates) {
    super()
    this.coordinates = coordinates
    this.tileLayer = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}'
    this.attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'

    this.markers = []
    this.mode = MODE_BIKES

    this.bounds = this.retrieveFromLocalStorage('bounds')

    this.options = { 
      scrollWheelZoom: true,
      zoomControl: true,
      maxBoundsViscosity: 1.0
    }
  }

  bindKeys () {
    document.onkeydown = (e) => {
      e = e || window.event

      if (e.keyCode === 27) {
        this.removeMarker()
      }
    }
  }

  bindEvents () {
    this.bindKeys()
    this.map.on('locationfound', this.onLocationFound.bind(this))
    this.map.on('locationerror', this.onLocationError.bind(this))
    this.map.on('moveend', this.onMapMoveEnd.bind(this))
    this.cluster.on('animationend', this.toggleMode.bind(this))
  }

  toggleLanes () {
    if (this.showLanes) {
      this.lanes.forEach(lane => { this.map.addLayer(lane) })
    } else {
      this.lanes.forEach(lane => { this.map.removeLayer(lane) })
    }
  }

  toggleMode () {
    this.markers.forEach((data) => {
      const $marker = data.marker.getElement()
      const station = data.marker.options.station

      if ($marker && station) {
        $marker.classList.toggle('is-dock', this.mode === MODE_BASES)

        const classNames = ['is-empty', 'is-low', 'is-ok', 'is-good']

        classNames.forEach((className) => {
          $marker.classList.remove(className)
        })

        $marker.classList.add(this.getIconClassNameForStation(station))
      }
    })
  }

  addLanes () {
    this.lanes = []
    const files = ['/barcelona.geojson', '/madrid.geojson']

    files.forEach(file => {
      this.get(file)
        .then(this.onGetLanes.bind(this))
        .catch((error) => {
          console.error(error)
        })
    })
  }

  onGetLanes (response) {
    response.json().then((data) => {

      const lane = L.geoJSON(data, {
        style: () => {
          return {
            interactive:false,
            "color": "#23D5AB",
            "weight": 8,
            "opacity": 0.5
          }
        }
      })

      this.lanes.push(lane)

      if (this.lanes.length === 2) {
        this.addLanesControl()
      }
    })
  }

  onMapMoveEnd () {
    this.saveToLocalStorage('bounds', this.map.getBounds().toBBoxString())
    this.toggleLanesControl()
    this.toggleModeControl()
  }

  toggleModeControl () {
    const isBarcelona = this.map.getBounds().intersects(BARCELONA_BOUNDS)
    const isMadrid = this.map.getBounds().intersects(MADRID_BOUNDS)

    if (this.modeControl) {
      if (this.map.getZoom() > 11 && (isBarcelona || isMadrid)) {
        this.modeControl.getContainer().classList.remove('is-hidden')
      } else {
        this.modeControl.getContainer().classList.add('is-hidden')
      }
    }
  }

  toggleLanesControl () {
    const isBarcelona = this.map.getBounds().intersects(BARCELONA_BOUNDS)
    const isMadrid = this.map.getBounds().intersects(MADRID_BOUNDS)

    if (this.lanesControl) {
      if (this.map.getZoom() > 13 && (isBarcelona || isMadrid)) {
        this.lanesControl.getContainer().classList.remove('is-hidden')
      } else {
        this.lanesControl.getContainer().classList.add('is-hidden')
      }
    }
  }

  onLocationError (event) {
    this.emit('stop-loading')
    this.locateControl.stopLoading()
  }

  onLocationFound (data) {
    this.emit('stop-loading')
    this.locateControl.stopLoading()
    this.addUserMarker(data)
    this.map.setView(data.latlng, 17, { animate: true, easeLinearity: 0.5, duration: 0.5 })
  }

  renderStations (stations) {
    stations.reverse().forEach(this.addMarker.bind(this)) 
    this.map.addLayer(this.cluster)
  }

  flattenCoordinates (coordinates) {
    return [coordinates.lat, coordinates.lng]
  }

  addUserMarker (data) {
    if (this.userMarker) {
      this.userMarker.remove()
    }

    const location = data.latlng
    const icon = this.getUserIcon()

    this.userMarker = L.marker(location, { icon }).addTo(this.map)

    this.userMarker.on('click', () => {
      this.map.setView(location, 19, { animate: true, easeLinearity: 0.5, duration: 0.5 })
    })
  }

  findMarkerByStationByIdAndCity (id, city) {
    return this.markers.find(data => {
      return data.marker.options.station.id === id && data.marker.options.station.city === city
    })
  }

  addMarker (station) {
    const m = this.findMarkerByStationByIdAndCity(station.id, station.city)

    if (m) {
      m.marker.options.station = station
      m.marker.setIcon(this.getIcon(station))
      m.marker.setPopupContent(m.popup.update(station).render())
      return
    }

    const coordinates = { lat: station.lat, lng: station.lng }
    const name = station.name
    const description = station.description
    const user = station.user
    const address = station.address
    const zoom = this.map.getZoom()

    const icon = this.getIcon(station)

    const latlng = this.flattenCoordinates(coordinates) 
    const marker = L.marker(latlng, { icon, station })

    this.cluster.addLayer(marker)

    marker.on('click', () => {
      this.emit('markerclick', station.id)
    })

    const popup = new Popup(station)
    popup.popup.setContent(popup.render())
    marker.bindPopup(popup.popup, { maxWidth: 'auto' })

    this.markers.push({ marker, popup })
  }

  removeMarker () {
    this.map.closePopup()
  }

  selectMarker (data) {
    const latlng = this.flattenCoordinates({ lat: data.lat, lng: data.lng })
    this.map.setView(latlng, 16)
  }

  getUserIcon () {
    return new L.divIcon({
      className: 'Marker is-user',
      html: '<div class="Marker__inner"></div>',
      iconSize: [24, 24],
      iconAnchor: new L.Point(12, 0)
    })
  }

  getIconClassNameForStation(station) {
    const value = station[this.mode]

    let className = 'is-empty'

    if (value >= 1 && value < 3) {
      className = 'is-low'
    } else if (value >= 3 && value < 5) {
      className = 'is-ok'
    } else if (value >= 5) {
      className = 'is-good'
    }

    return className
  }

  getIcon (station) {
    const classNames = ['Marker', this.getIconClassNameForStation(station)]
    const className = classNames.join(' ')

    return new L.divIcon({
      className,
      iconSize: [32, 32],
      iconAnchor: new L.Point(16, 0)
    })
  }

  addHelpControl () {
    L.Control.HelpControl = L.Control.extend({
      onRemove: () => { },
      onAdd: ()  => {
        const div = L.DomUtil.create('div', 'Control is-hidden Control__help')

        L.DomEvent.on(div, 'dblclick', this.killEvent.bind(this))

        L.DomEvent.on(div, 'click', (event) => {
          this.killEvent(event)
          this.emit('show-about')
        })

        setTimeout(() => {
          div.classList.remove('is-hidden')
        }, 800)

        return div
      }
    })

    this.helpControl = new L.Control.HelpControl({ position: 'topright' }).addTo(this.map)
  }

  addLanesControl () {
    L.Control.LanesControl = L.Control.extend({
      onRemove: () => { },
      onAdd: ()  => {
        const div = L.DomUtil.create('div', 'Control is-hidden Control__lanes')
        const icon = L.DomUtil.create('div', 'Control__icon')

        L.DomEvent.on(div, 'dblclick', this.killEvent.bind(this))
        L.DomEvent.on(div, 'click', (event) => {
          this.killEvent(event)
          this.showLanes = !this.showLanes
          this.toggleLanes()
          div.classList.toggle('is-selected', this.showLanes)
        })

        div.appendChild(icon)

        setTimeout(() => {
          this.toggleLanesControl()
        }, 400)

        return div
      }
    })

    this.lanesControl = new L.Control.LanesControl({ position: 'topright' }).addTo(this.map)
  }

  addLocateControl () {
    L.Control.LocateControl = L.Control.extend({
      startLoading: () => {
        this.locateControl._container.classList.add('is-loading')
      },
      stopLoading: () => {
        this.locateControl._container.classList.remove('is-loading')
      },
      onRemove: () => { },
      onAdd: ()  => {
        const div = L.DomUtil.create('div', 'Control is-hidden Control__locate')
        const icon = L.DomUtil.create('div', 'Control__icon')
        const spinner = L.DomUtil.create('div', 'Spinner is-mini')

        div.appendChild(spinner)
        div.appendChild(icon)

        L.DomEvent.on(div, 'click', (e) => {
          e.stopPropagation()
          e.preventDefault()

          this.map.locate({setView: false })

          this.emit('start-loading')
          this.locateControl.startLoading()
        })

        setTimeout(() => {
          div.classList.remove('is-hidden')
        }, 800)

        return div
      }
    })

    this.locateControl = new L.Control.LocateControl({ position: 'topright' }).addTo(this.map)
  }

  addModeControl () {
    L.Control.ModeControl = L.Control.extend({
      onRemove: () => { },
      onAdd: ()  => {
        const div = L.DomUtil.create('div', 'Control is-hidden Control__mode')
        const bikes = L.DomUtil.create('div', 'Control__modeBikes')
        const docks = L.DomUtil.create('div', 'Control__modeDocks')

        L.DomEvent.on(div, 'dblclick', this.killEvent.bind(this))

        L.DomEvent.on(div, 'click', (event) => {
          this.killEvent(event)

          this.mode = (this.mode === 'bikes' ) ? MODE_BASES : MODE_BIKES
          div.classList.toggle('is-dock', this.mode === MODE_BASES)
          this.toggleMode()
        })

        div.appendChild(bikes)
        div.appendChild(docks)

        setTimeout(() => {
          this.toggleModeControl()
        }, 800)

        return div
      }
    })

    this.modeControl = new L.Control.ModeControl({ position: 'topright' }).addTo(this.map)
  }

  getIconForCluster (cluster) {
    return L.divIcon({
      className: "Cluster",
      html: '<div>' + cluster.getChildCount() + '</div>',
      iconSize: [32, 32],
      iconAnchor: new L.Point(16, 0)
    })
  }

  centerToBounds(bounds) {
    try {
      const [west, south, east, north] = bounds.split(',').map(parseFloat)
      const newBounds = new L.LatLngBounds(new L.LatLng(south, west), new L.LatLng(north, east))
      this.map.fitBounds(newBounds)
    } catch (error) {
      console.error(error)
    }
  }

  addAirQuality () {
    this.get('/air.json')
      .then(this.onGetAirQuality.bind(this))
      .catch((error) => {
        console.error(error)
      })
  }

  onGetAirQuality (response) {
    response.json().then((data) => {
      data.forEach(this.addAirMarker.bind(this))
    })
  }

  addAirMarker(data) {
    const icon = this.getAirIcon(data)
    const marker = L.marker([data.lat, data.lng], { icon, data }).addTo(this.map)

    const popup = new AirPopup(data)
    popup.popup.setContent(popup.render())
    marker.bindPopup(popup.popup, { maxWidth: 'auto' })
  }

  getAirIcon (data) {
    const className = `Marker is-air is-${data.qualityIndex}`

    return new L.divIcon({
      className,
      html: `<div class="Marker__inner"></div>`,
      iconSize: [32, 32],
      iconAnchor: new L.Point(16, 0)
    })
  }

  render () {
    const attribution = this.attribution

    this.map = L.map('map', this.options).setView([this.coordinates.lat, this.coordinates.lng], this.coordinates.zoom)

    if (this.bounds) {
      this.centerToBounds(this.bounds)
    }

    this.addLanes()
    this.addHelpControl()
    this.addModeControl()
    this.addLocateControl()
    this.addAirQuality()

    this.cluster = L.markerClusterGroup({
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 20,
      iconCreateFunction: this.getIconForCluster.bind(this)
    })

    L.tileLayer(this.tileLayer+ (L.Browser.retina ? '@2x.png' : '.png'), {
      attribution,
      subdomains: 'abcd',
      maxZoom: 20,
      minZoom: 0
    }).addTo(this.map)

    this.bindEvents()
  }
}
