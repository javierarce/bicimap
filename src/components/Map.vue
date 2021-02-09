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
      stations: [],
      cluster: {},
      map: {},
      locateControl: null,
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
      window.bus.$off(config.ACTIONS.ADD_LOCATIONS)
      window.bus.$off(config.ACTIONS.REMOVE_MARKER)
      window.bus.$off(config.ACTIONS.INVALIDATE_MAP_SIZE)
      window.bus.$off(config.ACTIONS.SHOW_DEFAULT_POINT)
      window.bus.$off(config.ACTIONS.VISIT_MARKER)
      window.bus.$off(config.ACTIONS.CHANGE_MODE)

      window.bus.$on(config.ACTIONS.ADD_LOCATIONS, this.onAddStations)
      window.bus.$on(config.ACTIONS.REMOVE_MARKER, this.onRemoveMarker)
      window.bus.$on(config.ACTIONS.INVALIDATE_MAP_SIZE, this.invalidateSize)
      window.bus.$on(config.ACTIONS.SHOW_DEFAULT_POINT, this.showDefaultPoint)
      window.bus.$on(config.ACTIONS.VISIT_MARKER, this.onVisitMarker)
      window.bus.$on(config.ACTIONS.CHANGE_MODE, this.changeMode)
    },
    bindKeys () {
      document.onkeydown = (e) => {
        e = e || window.event

        if (e.keyCode === 27) {
          this.removeMarker()
        }
      }
    },
    onVisitMarker (marker) {
      this.map.setView(marker.getLatLng(), 17, { animate: true, easeLinearity: .5, duration: 0.250 })
      marker.fire('click')
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
    toggle () {
      this.expanded = !this.expanded
      window.bus.$emit(config.ACTIONS.TOGGLE_MAP_SIZE, this.expanded)
      this.locateControl.getContainer().classList.toggle('is-expanded')

      setTimeout(() => {
        window.bus.$emit(config.ACTIONS.INVALIDATE_MAP_SIZE)
      }, 200)
    },
    showDefaultPoint () {
      this.map.flyTo([config.MAP.LAT, config.MAP.LON], config.MAP.ZOOM, {
        animate: true,
        duration: 1
      })
    },
    onRemoveMarker (id) {
      let index = window.bus.markers.findIndex((item) => { 
        return item.options.location.id === id
      })

      if (index !== -1) {
        this.map.removeLayer(window.bus.markers[index])
        this.$delete(window.bus.markers, index)
      } else {
        console.error('Marker not found', window.bus.markers)
      }
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
      let description = `Bicicletas: ${location.dock_bikes} Bases libres: ${location.free_bases}`
      let address = location.address

      this.popup = this.createPopup(latlng, { name, description, address })

      let icon = this.getIcon(location)
      let marker = L.marker(latlng, { icon, location })

      marker.on('mouseover', (e) => {
        marker.openPopup()
      })

      marker.on('mouseout', (e) => {
        this.map.closePopup()
      })

      marker.on('click', () => {
        this.calculateClosestStationsToMarker(marker)
      })

      marker.bindPopup(this.popup, { maxWidth: 'auto' })
      marker.data = { id: 123 }

      this.cluster.addLayer(marker)
      window.bus.markers.push(marker)
    },
    changeMode (mode) {
      this.mode = mode
    },
    setPickupMode () {
      this.mode = PICKUP_MODE
    },
    setLeaveMode () {
      this.mode = LEAVE_MODE
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
          let div = L.DomUtil.create('div', 'LocateControl')
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

      this.locateControl = this.createLocateControl({ position: 'topright' }).addTo(this.map)

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
    },

    calculateClosestStationsToMarker (marker) {
        let latlng = marker.getLatLng()
        let circle = turf.circle([latlng.lng, latlng.lat], 0.5, { steps: 20, units: 'kilometers'})

        L.geoJSON(circle, {
          style: function(feature) {
            return {
              color: "red"
            }
          }
        }).addTo(this.map)

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

    createLocateControl (opts) {
      return new L.Control.LocateControl(opts)
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

      let header = L.DomUtil.create('div', 'Popup__header js-name', content)

      header.innerHTML = options.name

      let body = L.DomUtil.create('div', 'Popup__body', content)

      let description = L.DomUtil.create('div', 'Popup__description js-comment', body)

      if (options.description) {
        description.innerText = options.description
      }

      let address = L.DomUtil.create('div', 'Popup__address js-address', body)

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
    setName (text) {
      this.popup.getContent().querySelector('.js-name').textContent = text
    },
    getName () {
      return document.body.querySelector('.js-name').textContent
    },
    getDescription () {
      return document.body.querySelector('.js-description').value
    },
    setDescription (text) {
      document.body.querySelector('.js-description').value = text
    },
    removeMarker () {
      this.map.closePopup()

      if (this.marker) {
        this.marker.remove()
        this.marker = undefined
        return true
      }
    },
    focusOnPopup () {
      this.popup.getContent().querySelector('.js-description').focus()
    },
    invalidateSize () {
      this.map.invalidateSize(true)
    },
    truncate (text, length = 100) {
      if (!text) {
        return
      }
      return text.length > length ? `${text.substring(0, length)}...` : text
    }
  }
}
</script>

