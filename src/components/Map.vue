<template>
  <div class="Map__container">
    <div id="map" class="Map show-bikes"></div>
  </div>
</template>

<script>
import mixins from '../mixins'
import config from '../../config'
import mapConfig from '../../map.yaml'

import * as turf from '@turf/turf'
import * as L from 'leaflet'
require('leaflet.markercluster')

const PICKUP_MODE = 0
const LEAVE_MODE = 1

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
      locateControl: null,
      lanesControl: null,
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
          let what = value? 'free_bases' : 'dock_bikes'

          element.classList.toggle('is-low', location[what] < 3)
          element.classList.toggle('is-ok', location[what] >= 3 && location[what] < 5)
          element.classList.toggle('is-good', location[what] >= 5)
          element.querySelector('.data').innerText = location[what]
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
      window.bus.$off(config.ACTIONS.INVALIDATE_MAP_SIZE)
      window.bus.$off(config.ACTIONS.SHOW_DEFAULT_POINT)
      window.bus.$off(config.ACTIONS.TOGGLE_MODE)

      window.bus.$on(config.ACTIONS.ADD_STATIONS, this.onAddStations)
      window.bus.$on(config.ACTIONS.INVALIDATE_MAP_SIZE, this.invalidateSize)
      window.bus.$on(config.ACTIONS.SHOW_DEFAULT_POINT, this.showDefaultPoint)
      window.bus.$on(config.ACTIONS.TOGGLE_MODE, this.toggleMode)
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
      let html = `<div class="data">${this.mode ? location.free_bases : location.dock_bikes}</div>`

      let classNames = [ 'icon' ]

      let what = this.mode ? 'free_bases' : 'dock_bikes'

      if (location && location[what] < 3) {
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
        iconSize: [32, 32],
        iconAnchor: new L.Point(16, 0)
      })
    },
    showDefaultPoint () {
      this.map.flyTo([config.MAP.LAT, config.MAP.LON], config.MAP.ZOOM, {
        animate: true,
        duration: 1
      })
    },
    onAddStations (stations) {
      this.stations = stations
      this.stations.forEach(this.addMarker.bind(this)) 
      window.bus.$emit(config.ACTIONS.ON_LOAD)
      this.map.addLayer(this.cluster)
    },
    fitBounds () {
      let group = L.featureGroup(window.bus.markers)
      this.map.fitBounds(group.getBounds())
    },
    addMarker (location) {
      let latlng = [location.latitude, location.longitude]

      let name = `${location.number} | ${location.name}`
      let description = `<strong>Bicicletas</strong>: ${location.dock_bikes}. <strong>Bases libres</strong>: ${location.free_bases}`
      let address = location.address

      this.popup = this.createPopup(latlng, { name, description, address })

      let icon = this.getIcon(location)
      let marker = L.marker(latlng, { icon, location })


      marker.on('click', () => {
        marker.closeTooltip()
        this.calculateClosestStationsToMarker(marker)
      })

      marker.bindPopup(this.popup, { maxWidth: 'auto' })
      marker.bindTooltip(description, {
        direction: 'top',
        offset: [0, -2],
        className: 'Marker__tooltip'
      })

      this.cluster.addLayer(marker)
      window.bus.markers.push(marker)
    },
    toggleMode (mode) {
      this.mode = mode
    },
    init () {
      let options = { 
        scrollWheelZoom: true,
        zoomControl: true,
        maxBoundsViscosity: 1.0,
      }

      this.map = L.map('map', options).setView([config.MAP.LAT, config.MAP.LON], config.MAP.ZOOM)

      this.map.zoomControl.setPosition('topright')

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

      this.addLocateControl()

      this.cluster = L.markerClusterGroup({
        disableClusteringAtZoom: 14,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 0
      }).addTo(this.map)

      this.addLanes()
    },

    addLanesControl () {
      L.Control.LanesControl = L.Control.extend({
        onRemove: () => {
        },
        onAdd: (map)  => {
          let div = L.DomUtil.create('div', 'Control Control__lanes')

          L.DomEvent.on(div, 'click', (e) => {
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
        onAdd: (map)  => {
          let div = L.DomUtil.create('div', 'Control Control__locate')
          let spinner = L.DomUtil.create('div', 'Spinner is-mini')

          div.appendChild(spinner)

          L.DomEvent.on(div, 'click', (e) => {
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
      this.get(config.ENDPOINTS.LANES)
        .then(this.onGetLanes.bind(this))
        .catch((error) => {
          console.error(error)
        })
    },

    onGetLanes (response) {
      response.json().then((data) => {
        this.lanes = L.geoJSON(data, {
          style: (feature) => {
            return {
              "color": "#23D5AB",
              "weight": 8,
              "opacity": 0.5,
            }
          }
        })

        this.addLanesControl()
      })
    },

    calculateClosestStationsToMarker (marker) {
        let latlng = marker.getLatLng()
        let circle = turf.circle([latlng.lng, latlng.lat], 0.5, { steps: 20, units: 'kilometers'})

//        L.geoJSON(circle, {
//          style: function(feature) {
//            return {
//              color: "red"
//            }
//          }
//        }).addTo(this.map)

        let points = []

        this.stations.forEach((station) => {
          if (+station.longitude !== latlng.lng && +station.latitude !== latlng.lat) {
            points.push([ station.longitude, station.latitude ])
          }
        })

        if (points) {
          let pointsWithin = turf.pointsWithinPolygon(turf.points(points), circle)

          let distances = []

          pointsWithin.features.forEach((feature) => {
            let from = turf.point([latlng.lng, latlng.lat])
            let to = turf.point(feature.geometry.coordinates)
            let options = { units: 'kilometers' }

            let distance = turf.distance(from, to, options)
            distances.push({ coordinates: feature.geometry.coordinates, distance })
          })

          if (distances) {
            let sorted = Object.keys(distances)
              .sort(function(a,b) {  return distances[a].distance - distances[b].distance })
              .map(function(k) { return distances[k] })
            console.log(sorted.slice(0, 3));
          }
        }
    },

    createZoomOut (opts) {
      return new L.Control.ZoomOut(opts)
    },

    createPopup (coordinates, options = {}) {
      let classNames = []

      if (options.address || window.bus.isLoggedIn()) {
        classNames.push('has-address')
      }

      let className = 'Popup'

      this.popup = L.popup({
        className
      })

      let content = L.DomUtil.create('div', `Popup__content ${classNames.join(' ')}`)

      let header = L.DomUtil.create('div', 'Popup__header', content)

      header.innerHTML = options.name

      let body = L.DomUtil.create('div', 'Popup__body', content)

      let description = L.DomUtil.create('div', 'Popup__description', body)

      if (options.description) {
        description.innerHTML = options.description
      }

      let address = L.DomUtil.create('div', 'Popup__address', body)

      if (options.address) {
        address.innerText = options.address
      }

      this.popup.setContent(content)

      return this.popup
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
    },
    invalidateSize () {
      this.map.invalidateSize(true)
    }
  }
}
</script>

