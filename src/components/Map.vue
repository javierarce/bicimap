<template>
  <div class="Map__container">
    <Search />
    <div id="map" class="Map show-bikes"></div>
  </div>
</template>

<script>
import mixins from '../mixins'
import config from '../../config'

import Search from './Search.vue'
import Popup from './Popup.vue'
import AirPopup from './AirPopup.vue'

import Vue from 'vue';

import * as L from 'leaflet'
require('leaflet.markercluster')

const PICKUP_MODE = 0

export default {
  mixins: [mixins],
  components: {
    Search
  },
  data() {
    return {
      pointA: undefined,
      pointB: undefined,
      cluster: {},
      coordinates: undefined,
      expanded: false,
      helpControl: null,
      lanes: {},
      lanesControl: null,
      locateControl: null,
      map: {},
      marker: undefined,
      mode: PICKUP_MODE,
      modeControl: null,
      options: {},
      showLanes: false,
      stations: [],
      you: undefined
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
          let tooltipDescription = this.getTooltipContent(location, value)

          marker.setTooltipContent(tooltipDescription)

          let what = value? 'free_bases' : 'dock_bikes'

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

      window.bus.$off(config.ACTIONS.SET_VIEW)
      window.bus.$on(config.ACTIONS.SET_VIEW, this.onSetView)

      window.bus.$off(config.ACTIONS.ADD_POINT)
      window.bus.$on(config.ACTIONS.ADD_POINT, this.onGetPoint)
    },

    bindKeys () {
      document.onkeydown = (e) => {
        e = e || window.event

        if (e.keyCode === 27) {
          this.removeMarker()
        }
      }
    },

    getPercentageOfBikes (location) {
      let bikes = location.dock_bikes - location.reservations_count
      let bases = location.total_bases

      return Math.round((bikes / bases.toFixed()) * 100)
    },

    getStationIconClassNames (location) {
      let classNames = [ 'BikeStationMarker' ]

      let what = this.mode ? 'free_bases' : 'dock_bikes'
      classNames.push(this.mode ? 'is-docks' : '')

      if (location) {
        if (location[what] === 0) {
          classNames.push('is-empty')
        } else if (location[what] < 3) {
          classNames.push('is-low')
        } else if (location[what] >= 3 && location[what] < 5) {
          classNames.push('is-ok')
        } else if (location[what] >= 5) {
          classNames.push('is-good')
        } else {
          classNames.push('is-bad')
        }

        if (!location.activate) {
          classNames.push('is-disabled')
        }
      }

      return classNames.join(' ')
    },

    getAirIconClassNames (data) {
      let classNames = [ 'AirStationMarker' ]

      classNames.push(`is-${data.qualityIndex}`)

      return classNames.join(' ')
    },

    parseAddress(address) {
      let parts = []

      let tpl = 'road, house_number, city'

      tpl.split(', ').forEach((part) => {
        if (address && address[part]) {
          parts.push(address[part])
        }
      })

      let description = 'Lugar misterioso'

      if (parts.length) {
        if (address['shop']) {
          description = `<strong>${address['shop']}</strong> / ${parts.join(', ') }`
        } else {
          description = parts.join(', ')
        }
      }

      return description
    },

    onGetPoint (point) {
      console.log(this.pointA, this.pointB)

      if (this.pointA) {
        this.pointB = point
      } else {
        this.pointA = point
      } 

      if (this.pointA && this.pointB) {
        let start = this.pointA.reverse().join(',')
        let end = this.pointB.reverse().join(',')

        fetch(`/api/route?start=${start}&end=${end}`).then((result) => {
          result.json().then((data) => {
            let layer =  L.geoJSON(data, {
              style: () => {
                return {
                  interactive:false,
                  "color": "#23D5AB",
                  "weight": 8,
                  "opacity": 0.5
                }
              }
            })

            this.pointA = undefined
            this.pointB = undefined

            this.map.addLayer(layer)
          })

        }).catch((error) => {
          console.error(error)
        })
      }
    },

    onSetView (result) {
      let latlng = [result.lat, result.lon]
      this.coordinates = { lat: latlng[0], lng: latlng[1] }

      let name = result.display_name.split(',')[0]
      let address = (result && this.parseAddress(result.address)) || undefined

      this.addLocationMarker(latlng, name, address)
      this.map.setView(latlng, 17)
    },

    onAddStations (stations) {
      if (this.stations && this.stations.length) {
        this.updateStations(stations)
      } else {

        this.cluster = L.markerClusterGroup({
          disableClusteringAtZoom: 14,
          spiderfyOnMaxZoom: false,
          showCoverageOnHover: false
        })

        this.map.addLayer(this.cluster)

        this.stations = stations
        this.stations.forEach(this.addStationMarker.bind(this))
      }
    },

    updateStations (stations) {
      this.stations = stations

      let markers = this.cluster.getLayers()

      markers.forEach((marker) => { 
        let id = marker.options.location.id
        let location = this.getStationById(id)

        if (location) {
          let tooltipContent = this.getTooltipContent(location, this.mode)
          let icon = this.getStationIcon(location)

          let PopupClass = Vue.extend(Popup)
          let popupContent = new PopupClass({ propsData: { location } })

          marker.setPopupContent(popupContent.$mount().$el)
          marker.setTooltipContent(tooltipContent)
          marker.setIcon(icon)
        }
      })
    },

    getStationById (id) {
      return this.stations.find(station => station.id === id)
    },

    addLocationMarker (latlng, name, address) {
      let icon = this.getLocationIcon(location)

      let marker = L.marker(latlng, { icon, location })

      this.bindLocationMarker(marker, latlng, address)

      this.map.addLayer(marker)
    },

    addStationMarker (location) {
      let PopupClass = Vue.extend(Popup)
      let popupContent = new PopupClass({ propsData: { location } })

      let latlng = [location.latitude, location.longitude]

      let popup = L.popup({
        className: 'BikeStationPopup',
        offset: [0, 12]
      })

      let icon = this.getStationIcon(location)
      popup.setContent(popupContent.$mount().$el)

      let marker = L.marker(latlng, { icon, location })

      this.bindStationMarker(marker, this.getTooltipContent(location, this.mode), popup)

      this.cluster.addLayer(marker)
      window.bus.markers.push(marker)
    },

    addAirMarker(data) {
      let popup = L.popup({
        className: 'AirStationPopup',
        offset: [0, 12]
      })

      let icon = this.getAirIcon(data)

      let PopupClass = Vue.extend(AirPopup)
      let popupContent = new PopupClass({ propsData: { station: data } })

      popup.setContent(popupContent.$mount().$el)

      let marker = L.marker([data.lat, data.lng], { icon, data }).addTo(this.map)
      marker.bindPopup(popup, { maxWidth: 'auto' })
    },

    getAirIcon (data) {
      return new L.divIcon({
        className: this.getAirIconClassNames(data),
        html: `<div class="AirStationMarker__inner"></div>`,
        iconSize: [30, 30],
        iconAnchor: new L.Point(15, 0)
      })
    },

    getLocationIcon () {
      return new L.divIcon({
        className: 'LocationMarker',
        html: `<div class="LocationMarker__inner"></div>`,
        iconSize: [30, 30],
        iconAnchor: new L.Point(15, 0)
      })
    },

    getStationIcon (location) {
      return new L.divIcon({
        className: this.getStationIconClassNames(location),
        html: `<div class="BikeStationMarker__inner"></div>`,
        iconSize: [30, 30],
        iconAnchor: new L.Point(15, 0)
      })
    },

    getTooltipContent (location, mode) {
      let parts = [this.pluralize(location.dock_bikes, 'bici', 'bicis'), this.pluralize(location.free_bases, 'base', 'bases')]
      let description = mode ? parts.reverse() : parts

      return description.join(' / ')
    },

    bindLocationMarker (marker, latlng, description) {

      marker.on('click', () => {
        this.map.setView(latlng, 19, { animate: true, easeLinearity: 0.5, duration: 0.5 })
      })
      marker.bindTooltip(description, {
        direction: 'top',
        offset: [0, -2],
        className: 'LocationMarker__tooltip'
      })
    },

    bindStationMarker (marker, description, popup) {
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
        className: 'BikeStationMarker__tooltip'
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

      this.cluster = L.markerClusterGroup({
        disableClusteringAtZoom: 14,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false
      })

      this.map.on('locationfound', (data) => {
        window.bus.$emit(config.ACTIONS.STOP_LOADING)
        this.locateControl.stopLoading()
        let location = data.latlng
        this.map.setView(location, 17, { animate: true, easeLinearity: 0.5, duration: 0.5 })

        if (this.you) {
          this.you.remove()
        }

        let icon = new L.divIcon({
          className: 'BikeStationMarker is-you',
          html: '<div class="BikeStationMarker__inner"></div>',
          iconSize: [30, 30],
          iconAnchor: new L.Point(15, 0)
        })

        this.you = L.marker(location, { icon }).addTo(this.map)

        this.you.on('click', () => {
          this.map.setView(location, 19, { animate: true, easeLinearity: 0.5, duration: 0.5 })
        })
      })

      this.map.on('locationerror', (e) => {
        window.bus.$emit(config.ACTIONS.STOP_LOADING)
        this.locateControl.stopLoading()
        console.log('location error', e)
      })

      this.addHelpControl()
      this.addModeControl()

      this.layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 0
      }).addTo(this.map)

      this.addLanes()
      this.addAir()
      this.map.whenReady(this.onMapReady)
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
          let div = L.DomUtil.create('div', 'Control is-hidden Control__mode')
          let bikes = L.DomUtil.create('div', 'Control__modeBikes')
          let docks = L.DomUtil.create('div', 'Control__modeDocks')

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

            this.mode = !this.mode
            div.classList.toggle('is-docks', this.mode)
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
    },

    addHelpControl () {
      L.Control.HelpControl = L.Control.extend({
        onRemove: () => {
        },
        onAdd: ()  => {
          let div = L.DomUtil.create('div', 'Control is-hidden Control__help')

          L.DomEvent.on(div, 'dblclick', (e) => {
            e.stopPropagation()
            e.preventDefault()
          })

          L.DomEvent.on(div, 'click', (e) => {
            e.stopPropagation()
            e.preventDefault()

            window.bus.$emit(config.ACTIONS.OPEN_ABOUT)
          })

          setTimeout(() => {
            div.classList.remove('is-hidden')
          }, 800)

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
      this.addLocateControl()
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
          let div = L.DomUtil.create('div', 'Control is-hidden Control__locate')
          let spinner = L.DomUtil.create('div', 'Spinner is-mini')

          div.appendChild(spinner)

          L.DomEvent.on(div, 'click', (e) => {
            e.stopPropagation()
            e.preventDefault()
          })

          L.DomEvent.on(div, 'touchstart', (e) => {
            e.stopPropagation()
            e.preventDefault()

            this.map.locate({setView: false })

            window.bus.$emit(config.ACTIONS.START_LOADING)
            this.locateControl.startLoading()
          })

          setTimeout(() => {
            div.classList.remove('is-hidden')
          }, 800)

          return div
        }
      })

      this.locateControl = new L.Control.LocateControl({ position: 'topright' }).addTo(this.map)
    },

    addLanes () {
      this.get('/lanes.min.geojson')
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

    addAir () {
      this.get('/air.json')
        .then(this.onGetAir.bind(this))
        .catch((error) => {
          console.error(error)
        })
    },

    onGetAir (response) {
      response.json().then((data) => {
        data.forEach(this.addAirMarker.bind(this))
      })
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

