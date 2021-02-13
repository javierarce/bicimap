<template>
  <div class="Map__container">
    <div id="map" class="Map show-bikes"></div>
  </div>
</template>

<script>
import mixins from '../mixins'
import config from '../../config'

import * as L from 'leaflet'
require('leaflet.markercluster')

const PICKUP_MODE = 0

export default {
  mixins: [mixins],
  data() {
    return {
      mode: PICKUP_MODE,
      lanes: {},
      stations: [],
      cluster: {},
      map: {},
      showLanes: false,
      helpControl: null,
      lanesControl: null,
      locateControl: null,
      modeControl: null,
      expanded: false,
      coordinates: undefined,
      options: {},
      marker: undefined
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.bindEvents()
      this.init()
      window.map = this
    })
  },
  watch: {
    showLanes (state) {
      if (state) {
        this.map.addLayer(this.lanes)
      } else {
        this.map.removeLayer(this.lanes)
      }
    },
    mode (value) {
      window.bus.markers.forEach((marker) => {
        let element = marker.getElement()
        let location = marker.options.location
        if (element) {

          let tooltipDescription = `${this.pluralize(location.dock_bikes, 'bicicleta', 'bicicletas')}. ${this.pluralize(location.free_bases, 'base libre', 'bases libres')}.`

          if (value) {
            tooltipDescription = `${this.pluralize(location.free_bases, 'base libre', 'bases libres')}. ${this.pluralize(location.dock_bikes, 'bicicleta', 'bicicletas')}. `
          }
          marker.setTooltipContent(tooltipDescription)

          let what = value? 'free_bases' : 'dock_bikes'

          element.classList.toggle(`is-bikes`, what === 'dock_bikes')
          element.classList.toggle(`is-docks`, what === 'free_bases')

          element.classList.toggle('is-empty', location[what] === 0)
          element.classList.toggle('is-low', location[what] > 0 && location[what] < 3)
          element.classList.toggle('is-ok', location[what] >= 3 && location[what] < 5)
          element.classList.toggle('is-good', location[what] >= 5)
        }
      })
    }
  },
  computed: {
    toggleButtonClass () {
      return this.expanded ? 'is-expanded' : undefined
    }
  },
  methods: {
    bindEvents () {
      this.bindKeys()
      window.bus.$off(config.ACTIONS.ADD_STATIONS)
      window.bus.$on(config.ACTIONS.ADD_STATIONS, this.onAddStations)
    },
    bindKeys () {
      document.onkeydown = (e) => {
        e = e || window.event

        if (e.keyCode === 27) {
          this.removeMarker()
        }
      }
    },
    getIcon (location) {
      let html = `<div class="data"></div>`

      let classNames = [ 'icon' ]

      let what = this.mode ? 'free_bases' : 'dock_bikes'

      classNames.push(what ? 'is-bikes' : 'is-docks')

      if (location && location[what] === 0) {
        classNames.push('is-empty')
      } else if (location && location[what] < 3) {
        classNames.push('is-low')
      } else if (location && location[what] >= 3 && location[what] < 5) {
        classNames.push('is-ok')
      } else if (location && location[what] >= 5) {
        classNames.push('is-good')
      } else {
        classNames.push('is-bad')
      }

      if (location && !location.activate) {
        classNames.push('is-disabled')
      }

      let className = classNames.join(' ')

      return new L.divIcon({
        className,
        html,
        iconSize: [30, 30],
        iconAnchor: new L.Point(15, 0)
      })
    },
    onAddStations (stations) {
      if (this.stations && this.stations.length) {
        this.stations = stations
        this.updateStations()
      } else {
        this.stations.forEach(this.addMarker.bind(this))
        this.map.addLayer(this.cluster)
      }
    },
    updateStations () {
      this.cluster.getLayers().forEach((marker) => { 
        let station = this.getStationById(marker.options.location.id)

        let content = this.getPopupContent(station)
        let icon = this.getIcon(station)

        marker.setPopupContent(content)
        marker.setIcon(icon)
      })
    },
    getStationById (id) {
      return this.stations.find(station => station.id === id)
    },
    addMarker (location) {
      let latlng = [location.latitude, location.longitude]

      let tooltipDescription = this.getTooltipDescription(location)

      let popup = L.popup({
        className: 'Popup'
      })

      popup.setContent(this.getPopupContent(location))

      let icon = this.getIcon(location)
      let marker = L.marker(latlng, { icon, location }).addTo(this.map)

      this.bindMarker(marker, tooltipDescription, popup)

      this.cluster.addLayer(marker)
      window.bus.markers.push(marker)
    },
    getTooltipDescription (location) {
      return `${this.pluralize(location.dock_bikes, 'bicicleta', 'bicicletas')}. ${this.pluralize(location.free_bases, 'base libre', 'bases libres')}.`
    },
    bindMarker (marker, description, popup) {
      marker.on('click', () => {
        setTimeout(() => {
          marker.closeTooltip()
        }, 100)
      })

      marker.on('mousemove', () => { 
        if (marker.isPopupOpen() && marker.isTooltipOpen()) {
          marker.closeTooltip()
        }
      })

      marker.bindPopup(popup, { maxWidth: 'auto' })
      marker.bindTooltip(description, {
        direction: 'top',
        offset: [0, -2],
        className: 'Marker__tooltip'
      })
    },
    init () {
      let options = { 
        scrollWheelZoom: true,
        zoomControl: true,
        maxBoundsViscosity: 1.0,
        tap: false
      }

      this.map = L.map('map', options).setView([config.MAP.LAT, config.MAP.LON], config.MAP.ZOOM)

      this.map.zoomControl.setPosition('topleft')

      this.map.on('moveend', this.onMapMoveEnd)

      this.map.on('locationfound', (data) => {
        window.bus.$emit(config.ACTIONS.STOP_LOADING)
        this.locateControl.stopLoading()
        this.map.setView(data.latlng, 17, { animate: true, easeLinearity: 0.5, duration: 0.5 })
      })

      this.map.on('locationerror', (e) => {
        window.bus.$emit(config.ACTIONS.STOP_LOADING)
        this.locateControl.stopLoading()
        console.log('location error', e)
      })

      this.addHelpControl()
      this.addModeControl()
      this.addLocateControl()

      this.cluster = L.markerClusterGroup({
        disableClusteringAtZoom: 14,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false
      })

      this.layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 0
      }).addTo(this.map)

      this.map.whenReady(this.onMapReady)
      this.addLanes()
    },
    onMapMoveEnd () {
      this.saveToLocalStorage('bounds',this.map.getBounds().toBBoxString())
    },
    onMapReady () {
      let bounds = this.retrieveFromLocalStorage('bounds')
      try {
        if (bounds) {
          let [west, south, east, north] = bounds.split(',').map(parseFloat)
          let newBounds = new L.LatLngBounds(new L.LatLng(south, west), new L.LatLng(north, east))
          this.map.flyToBounds(newBounds)
        }

      } catch (error) {
        console.log(error)
      }
    },

    addModeControl () {
      L.Control.ModeControl = L.Control.extend({
        onRemove: () => {
        },
        onAdd: ()  => {
          let div = L.DomUtil.create('div', 'Control Control__mode')
          let bikes = L.DomUtil.create('div', 'Control__modeBikes')
          let docks = L.DomUtil.create('div', 'Control__modeDocks')

          L.DomEvent.on(div, 'click mousedown touchstart pointerdown', (e) => {
            e.stopPropagation()
            e.preventDefault()

            this.mode = !this.mode
            div.classList.toggle('is-docks', this.mode)
          })

          div.appendChild(bikes)
          div.appendChild(docks)

          return div
        }
      })

      this.modeControl = new L.Control.ModeControl({ position: 'topright' }).addTo(this.map)
    },

    addHelpControl () {
      L.Control.HelpControl = L.Control.extend({
        onRemove: () => {
        },
        onAdd: ()  => {
          let div = L.DomUtil.create('div', 'Control Control__help')

          L.DomEvent.on(div, 'click', (e) => {
            e.stopPropagation()
            e.preventDefault()

            window.bus.$emit(config.ACTIONS.OPEN_ABOUT)
          })
          return div
        }
      })

      this.helpControl = new L.Control.HelpControl({ position: 'topright' }).addTo(this.map)
    },
    addLanesControl () {
      L.Control.LanesControl = L.Control.extend({
        onRemove: () => {
        },
        onAdd: ()  => {
          let div = L.DomUtil.create('div', 'Control Control__lanes')

          L.DomEvent.on(div, 'click mousedown touchstart pointerdown', (e) => {
            e.stopPropagation()
            e.preventDefault()

            this.showLanes = !this.showLanes
            div.classList.toggle('is-selected', this.showLanes)
          })
          return div
        }
      })

      this.lanesControl = new L.Control.LanesControl({ position: 'topright' }).addTo(this.map)
    },

    addLocateControl () {
      L.Control.LocateControl = L.Control.extend({
        startLoading: () => {
          this.locateControl._container.classList.add('is-loading')
        },
        stopLoading: () => {
          this.locateControl._container.classList.remove('is-loading')
        },
        onRemove: () => {
        },
        onAdd: ()  => {
          let div = L.DomUtil.create('div', 'Control Control__locate')
          let spinner = L.DomUtil.create('div', 'Spinner is-mini')

          div.appendChild(spinner)

          L.DomEvent.on(div, 'click mousedown touchstart pointerdown', (e) => {
            e.stopPropagation()
            e.preventDefault()

            L.DomEvent.disableClickPropagation(div)
            this.map.locate({setView: false })
            window.bus.$emit(config.ACTIONS.START_LOADING)
            this.locateControl.startLoading()
          })
          return div
        }
      })

      this.locateControl = new L.Control.LocateControl({ position: 'topright' }).addTo(this.map)
    },

    addLanes () {
      this.get('/lanes.geojson')
        .then(this.onGetLanes.bind(this))
        .catch((error) => {
          console.error(error)
        })
    },

    onGetLanes (response) {
      response.json().then((data) => {
        this.lanes = L.geoJSON(data, {
          style: () => {
            return {
              interactive:false,
              "color": "#23D5AB",
              "weight": 8,
              "opacity": 0.5
            }
          }
        })

        this.addLanesControl()
      })
    },

    getPopupContent (location) {
      let name = `<div class="Station__id">${location.number}</div> ${location.name}`

      let bikes = this.pluralize(location.dock_bikes, 'bicicleta', 'bicicletas', { showAmount: false })
      let descriptionBikes = `<div class="Item"><div class="Item__amount">${location.dock_bikes}</div><div class="Item__title">${bikes}</div></div>`

      let bases = this.pluralize(location.free_bases, 'base libre', 'bases libres', { showAmount: false })
      let descriptionDocks = `<div class="Item"><div class="Item__amount">${location.free_bases}</div><div class="Item__title">${bases}</div></div>`

      let description = `<div class="Items">${descriptionBikes} ${descriptionDocks}</div>`

      let address = location.address

      let content = L.DomUtil.create('div', 'Popup__content')
      let header = L.DomUtil.create('div', 'Popup__header', content)
      let body = L.DomUtil.create('div', 'Popup__body', content)
      let popupDescription = L.DomUtil.create('div', 'Popup__description', body)
      let popupAddress = L.DomUtil.create('div', 'Popup__address', body)

      header.innerHTML = name
      popupDescription.innerHTML = description
      popupAddress.innerText = address

      return content
    },

    startLoading () {
      window.bus.$emit(config.ACTIONS.START_LOADING)
    },
    stopLoading () {
      window.bus.$emit(config.ACTIONS.STOP_LOADING)
    },
    removeMarker () {
      this.map.closePopup()

      if (this.marker) {
        this.marker.remove()
        this.marker = undefined
        return true
      }
    }
  }
}
</script>

