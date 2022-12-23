const MODE_BIKES = 'bikes'
const MODE_BASES = 'bases'

class Map extends Base {
  constructor (coordinates) {
    super()
    this.coordinates = coordinates
    this.tileLayer = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}'
    this.attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'

    this.markers = []
    this.mode = MODE_BIKES

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
    this.cluster.on('animationend', this.onModeChange.bind(this))
  }

  onModeChange () {
    this.markers.forEach((marker) => {
      const $marker = marker.getElement()
      const station = marker.options.station

      if ($marker && station) {
        $marker.classList.toggle('is-dock', this.mode === MODE_BASES)

        $marker.classList.remove('is-empty')
        $marker.classList.remove('is-low')
        $marker.classList.remove('is-ok')
        $marker.classList.remove('is-good')
        $marker.classList.remove('is-bad')
        $marker.classList.add(this.getIconClassNameForStation(station))
      }


        //marker.setTooltipContent(tooltipDescription)

        //let what = value? 'free_bases' : 'dock_bikes'
        //let whatLabel = 'free_bases'

        //if (city === 'barcelona') {
          //what = value? 'slots' : 'bikes'
          //whatLabel = 'slots'
        //}

        //element.classList.toggle(`is-docks`, what === whatLabel)

        //element.classList.toggle('is-empty', location[what] === 0)
        //element.classList.toggle('is-low', location[what] > 0 && location[what] < 3)
        //element.classList.toggle('is-ok', location[what] >= 3 && location[what] < 5)
        //element.classList.toggle('is-good', location[what] >= 5)
      //}
    })
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

  addMarker (station) {
    const coordinates = { lat: station.lat, lng: station.lng }
    const name = station.name
    const description = station.description
    const user = station.user
    const address = station.address
    const zoom = this.map.getZoom()

    const icon = this.getIcon(station)

    const latlng = this.flattenCoordinates(coordinates) 
    const marker = L.marker(latlng, { icon, station })

    const popup = new Popup(station)

    this.cluster.addLayer(marker)

    marker.on('click', () => {
      this.emit('markerclick', station.id)
    })

    popup.popup.setContent(popup.render())
    marker.bindPopup(popup.popup, { maxWidth: 'auto' })

    this.markers.push(marker)
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

    if (value < 3) {
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
        let div = L.DomUtil.create('div', 'Control is-hidden Control__help')

        L.DomEvent.on(div, 'dblclick', (e) => {
          e.stopPropagation()
          e.preventDefault()
        })

        L.DomEvent.on(div, 'click', (e) => {
          e.stopPropagation()
          e.preventDefault()

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
        let div = L.DomUtil.create('div', 'Control is-hidden Control__lanes')

        L.DomEvent.on(div, 'dblclick', (e) => {
          e.stopPropagation()
          e.preventDefault()
        })

        L.DomEvent.on(div, 'click', (e) => {
          e.stopPropagation()
          e.preventDefault()
        })

        L.DomEvent.on(div, 'touchstart', (e) => {
          e.stopPropagation()
          e.preventDefault()

          this.showLanes = !this.showLanes
          div.classList.toggle('is-selected', this.showLanes)
        })

        setTimeout(() => {
          div.classList.remove('is-hidden')
        }, 800)

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
        let div = L.DomUtil.create('div', 'Control is-hidden Control__locate')
        let spinner = L.DomUtil.create('div', 'Spinner is-mini')

        div.appendChild(spinner)

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

        L.DomEvent.on(div, 'dblclick', (e) => {
          e.stopPropagation()
          e.preventDefault()
        })

        L.DomEvent.on(div, 'click', (e) => {
          e.stopPropagation()
          e.preventDefault()

          this.mode = (this.mode === 'bikes' ) ? MODE_BASES : MODE_BIKES
          div.classList.toggle('is-dock', this.mode === MODE_BASES)
          this.onModeChange()
        })

        div.appendChild(bikes)
        div.appendChild(docks)

        setTimeout(() => {
          div.classList.remove('is-hidden')
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

  render () {
    const attribution = this.attribution

    this.map = L.map('map', this.options).setView([this.coordinates.lat, this.coordinates.lng], this.coordinates.zoom)

    this.addHelpControl()
    this.addModeControl()
    this.addLocateControl()

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
