class Base {
  constructor () {
    this.className = this.constructor.name
    this.templateData = {}
  }

  killEvent (event) {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  isEmpty (obj) {
    return Object.keys(obj).length === 0;
  }

  get (URL, content) {
    const headers = { 'Content-Type': 'application/json' }
    const method = 'GET'
    const options = { method, headers }

    return fetch(URL, options)
  }

  post (URL, content) {
    const headers = { 'Content-Type': 'application/json' }
    const method = 'POST'
    const body = JSON.stringify(content)
    const options = { method, headers, body }

    return fetch(URL, options)
  }

  createElement ({ className, html, text, elementType = 'div', type,  ...options }) {
    let $el = document.createElement(elementType)

    if (type) {
      $el.type = 'text'
    }

    if (html) {
      $el.innerHTML = html
    } else if (text) {
      $el.innerText = text
    }

    className.split(' ').filter(c => c).forEach(name => $el.classList.add(name))

    if (!this.isEmpty(options)) {
      Object.keys(options).forEach((key) => {
        $el[key] = options[key]
      })
    }

    return $el
  }

  template () {
    return `<div class="Template"></div>`
  }

  renderTemplate () {
    let className = this.className
    this.$el = this.createElement({ className })
    const html = ejs.render(this.template(), this.templateData)
    this.$el.insertAdjacentHTML('beforeend', html)
  }

  on (name, callback) {
    const $el = this.$el || document.body

    $el.addEventListener(name, (e) => {
      callback && callback(e.detail)
    })
  }

  emit (name, data) {
    if (!name) {
      console.error('Error: empty name event')
      return
    }

    let event = undefined

    if (data) {
      event = new CustomEvent(name, { detail: data })
    } else {
      event = new Event(name)
    }

    const $el = this.$el || document.body
    $el.dispatchEvent(event)
  }

  saveToLocalStorage (id, what) {
    if (window.localStorage) {
      window.localStorage.setItem(id, JSON.stringify(what))
    }
  }

  retrieveFromLocalStorage (id) {
    if (window.localStorage) {
      let what = window.localStorage.getItem(id)
      if (what) {
        return JSON.parse(what)
      }
    }
    return undefined
  }

  removeFromLocalStorage (id) {
    if (window.localStorage) {
      window.localStorage.removeItem(id)
    }
  }

  emptyLocalStorage () {
    if (window.localStorage) {
      window.localStorage.clear()
    }
  }

  render () {
    this.renderTemplate()
    return this.$el
  }
}
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
class Popup extends Base {
  constructor (station) {
    super()
    this.templateData = station
    this.popup = L.popup({ className: 'Popup', offset: [0, 12] })
  }

  update (station) {
    this.templateData = station
    return this
  }

  template () {
    return `<div class="Popup__content">
        <div class="Popup__header">
          <div class="Popup__id"><%= id -%></div>
          <span><%= name -%></span>
        </div>
        <div class="Popup__body">
        <div class="Popup__description">
        <div class="Items">
          <div class="Item">
          <div class="Item__icon is-bike"></div>
          <div class="Item__amount"><%= mechanical -%></div>
       </div>
       <% if (electric !== null) { %>
        <div class="Item">
          <div class="Item__icon is-ebike"></div>
          <div class="Item__amount"><%= electric -%></div>
      </div>
      <% } %>
      <div class="Item">
        <div class="Item__icon is-base"></div>
        <div class="Item__amount"><%= bases -%></div>
      </div>
      </div>
      </div>
      <div class="Popup__footer">
      <a href="https://www.google.com/maps/place/<%= address -%>, <%= city -%>/<%= lat -%>,<%= lng -%>, <%= zoom -%>z" target="_blank" title="Abrir en Google Maps" class="Popup__address"><%= address -%></a>
      </div>
      </div>
      </div>`
  }

    render () {
      this.renderTemplate()
      return this.$el
    }
}

class AirPopup extends Popup {
  constructor (station) {
    super(station)
    this.templateData = station

    this.AIR_QUALITY_DESCRIPTION = ['muy mala', 'mala', 'regular', 'buena', 'muy buena']
    this.templateData.time = this.time()
    this.templateData.pollutants = this.templateData.pollutants.filter(p => p.quality)
    this.templateData.quality = this.quality()
    this.templateData.href = `https://www.google.com/maps/search/?api=1&query=${this.templateData.lat},${this.templateData.lng}`

    this.popup = L.popup({ className: 'Popup', offset: [0, 12] })
  }

  time () {
    let time = undefined

    this.templateData.pollutants.forEach((pollutant) => {
      if (pollutant.quality) {
        time = pollutant.quality.time
      }
    })

    return time ? `${time}h` : '???'
  }

  quality () {
    return this.AIR_QUALITY_DESCRIPTION[this.templateData.qualityIndex - 1]
  }

  template () {
    return `<div class="Popup__content">
    <div class="Popup__header"><%= name -%></div>
    <div class="Popup__body">
      <div class="Popup__description">La calidad del aire a las <strong><%= time -%></strong> es <strong><%= quality -%></strong>.</div>
      <div class="Popup__pollutants">
        <% pollutants.forEach((pollutant) => { %>
               <div class="Popup__pollutant">
                 <div class="Popup__pollutantName"><%= pollutant.name -%></div>
                 <div class="Popup__pollutantValue"><span><%= pollutant.quality.lastValue -%></span>
                   <span class="Popup__pollutantUnit">µg/m<sup> 3</sup>
                  </div>
               </div>
        <% }); %> 

        <div class="Popup__pollutantsInfo">
          <a class="Popup__pollutantHelp" href="https://github.com/javierarce/aire-madrid/wiki/How-are-quality-indexes-calculated" target="_blank">
            Más información</a>
        </div>
      </div>
      <a class="Popup__address" href="<%= href %>" target="_blank" title="Abrir en Google Maps"><%= address  %></a>
    </div>
  </div>`
  }

  render () {
    this.renderTemplate()
    this.$el.classList.add('is-air')
    return this.$el
  }
}

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
        }, 600)

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
class About extends Base {
  constructor () {
    super()
    this.timestamp = 0
    this.templateData.timestamp = this.timestamp
    this.render()
  }

  bindEvents () {
    this.$el.onclick = (event) => {
      if (event.target.className === 'About__backdrop') {
        this.hide()
      }
    }
  }

  template () {
    return `<div class="About__inner has-transition">
      <div class="About__title">Acerca de este proyecto</div>
      <div class="About__content">


<p><strong>Bicimap</strong> ofrece una alternativa amable y usable a los mapas de bicis oficiales de BiciMAD y Bicing.</p>

          <div class="About__highlight">
            <p>Sigue el desarrollo del proyecto, sugiere mejoras e informa de errores en GitHub.</p>
            <a href="https://github.com/javierarce/bicimap" class="Button About__button is-bold" title="Visita el repositorio en GitHub" target="_blank">Visita el repositorio de código</a>
          </div>


        <div class="About__footer">
          <div>Actualizado hace <strong class="js-date"><%= timestamp -%></strong></div>
          <div>Creado por <a href="https://javier.computer" target="_blank">Javier Arce</a> sobre una bici</div>
        </div>

    </div>
    </div>
    <div class="About__backdrop"></div>`
  }

  hide () {
    this.$el.remove()
  }

  show () {
    document.body.prepend(this.$el)
  }

  setUpdatedAt (timestamp) {
    if (timestamp > this.timestamp) {
      this.timestamp = timestamp
    }

    this.$el.querySelector('.js-date').innerText = this.distance(this.timestamp)
  }

  distance (timestamp) {
    const now = new Date().getTime()
    const howLongAgo = timestamp - now

    const getHumanTime = (timestamp) => {

      const time = Math.abs(timestamp)
      let humanTime, units

      if (time > (1000 * 60 * 60 * 24 * 365)) {
        humanTime = parseInt(time / (1000 * 60 * 60 * 24 * 365), 10)
        units = humanTime == 1 ? 'año' : 'años'
      } else if (time > (1000 * 60 * 60 * 24 * 30)) {
        humanTime = parseInt(time / (1000 * 60 * 60 * 24 * 30), 10)
        units = humanTime == 1 ? 'mes' : 'meses'
      } else if (time > (1000 * 60 * 60 * 24 * 7)) {
        humanTime = parseInt(time / (1000 * 60 * 60 * 24 * 7), 10)
        units = humanTime == 1 ? 'semana' : 'semanas'
      } else if (time > (1000 * 60 * 60 * 24)) {
        humanTime = parseInt(time / (1000 * 60 * 60 * 24), 10)
        units = humanTime == 1 ? 'día' : 'días'
      } else if (time > (1000 * 60 * 60)) {
        humanTime = parseInt(time / (1000 * 60 * 60), 10)
        units = humanTime == 1 ? 'hora' : 'horas'
      } else if (time > (1000 * 60)) {
        humanTime = parseInt(time / (1000 * 60), 10)
        units = humanTime == 1 ? 'minuto' : 'minutos'
      } else {
        humanTime = parseInt(time / (1000), 10)
        units = humanTime == 1 ? 'segundo' : 'segundos'
      }

      const timeUnits = humanTime + ' ' + units

      if (timestamp > 0) {
        return 'error'
      }

      return timeUnits
    }

    return getHumanTime(howLongAgo)

  }

  render () {
    this.renderTemplate()
    this.bindEvents()

    return this.$el
  }
}
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
