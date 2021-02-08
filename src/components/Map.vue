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

const MAX_TITLE_LENGTH = 80

export default {
  mixins: [mixins],
  data() {
    return {
      stations: [],
      cluster: {},
      map: {},
      toggleMapControl: undefined,
      zoomOutControl: undefined,
      expanded: false,
      readonly: undefined,
      coordinates: undefined,
      options: {},
      marker: undefined,
      enableSend: false
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.bindEvents()
      this.init()
    })
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

      window.bus.$on(config.ACTIONS.ADD_LOCATIONS, this.onAddStations)
      window.bus.$on(config.ACTIONS.REMOVE_MARKER, this.onRemoveMarker)
      window.bus.$on(config.ACTIONS.INVALIDATE_MAP_SIZE, this.invalidateSize)
      window.bus.$on(config.ACTIONS.SHOW_DEFAULT_POINT, this.showDefaultPoint)
      window.bus.$on(config.ACTIONS.VISIT_MARKER, this.onVisitMarker)
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
      let html = `<div class="data"><div class="dock_bikes"><strong>${location.dock_bikes}</strong></div><div class="free_bases"><strong>${location.free_bases}</strong></div></div>`

      let classNames = [ 'icon' ]

      if (location && !location.approved && window.bus.isModerated()) {
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

      let name = location.name
      let description = `Bicicletas: ${location.dock_bikes} Bases libres: ${location.free_bases}`

      let user = location.address
      let address = location.address

      this.popup = this.createPopup(latlng, { name, description, user, address, readonly: true })

      let icon = this.getIcon(location)
      let marker = L.marker(latlng, { icon, location })

      marker.on('mouseover', (e) => {
        marker.openPopup()
      })

      marker.on('mouseout', (e) => {
        console.log('out')
        this.map.closePopup()
      })

      marker.on('click', () => {
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
      })

      marker.bindPopup(this.popup, { maxWidth: 'auto' })

      this.cluster.addLayer(marker)
      window.bus.markers.push(marker)
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

    createLocateControl (opts) {
      return new L.Control.LocateControl(opts)
    },
    createZoomOut (opts) {
      return new L.Control.ZoomOut(opts)
    },

    createPopup (coordinates, options = {}) {
      let classNames = []

      if (window.bus.isLoggedIn()) {
        classNames.push('is-logged')
      } 
      
      if (!window.bus.isLoggedIn() || options.description && options.description.length){
        classNames.push('can-send')
        this.enableSend = true
      }

      if (options.readonly) {
        classNames.push('is-readonly')
      }

      if (options.address || window.bus.isLoggedIn()) {
        classNames.push('has-address')
      }

      let className = 'Popup'

      this.popup = L.popup({
        className
      })

      let content = L.DomUtil.create('div', `Popup__content ${classNames.join(' ')}`)

      let header = L.DomUtil.create('div', 'Popup__header js-name', content)

      if (!options.readonly) {
        header.contentEditable='true'
      }

      header.innerHTML = options.name

      let body = L.DomUtil.create('div', 'Popup__body', content)

      let comment = L.DomUtil.create('div', 'Popup__comment', body)
      let controls = L.DomUtil.create('div', 'Popup__controls', body)

      L.DomUtil.create('div', 'Popup__spinner Spinner', body)
      L.DomUtil.create('div', 'Popup__success', body)

      let description = L.DomUtil.create('div', 'Popup__description js-comment', comment)

      if (options.description) {
        description.innerText = options.description
      }

      let textarea = L.DomUtil.create('textarea', 'Popup__input js-description', comment)
      textarea.setAttribute('placeholder', config.TEXTS.PLACEHOLDER)

      textarea.onkeyup = (e) => {
        let description = this.getDescription()

        if (window.bus.isLoggedIn()) {
          if (description.length > 0) {
            this.enableSendButton()
          } else {
            this.disableSendButton()
          }
        }
      }

      if (options.description && options.description.length) {
        textarea.innerText = options.description
        this.enableSendButton()
      }

      let btn = L.DomUtil.create('button', 'Button Popup__button', controls)
      btn.setAttribute('type', 'button')

      let showAddLocation = (window.bus.isLoggedIn() || window.bus.isAnonymous())

      btn.innerHTML = showAddLocation ? 'Add location' : 'Log in with Twitter'
      btn.onclick =  showAddLocation ? this.addLocation : this.login

      let address = L.DomUtil.create('div', 'Popup__address js-address', body)

      if (options.address) {
        address.innerText = options.address
      }

      this.popup.setContent(content)

      if (options.geocode) {
        this.geocode()
      }

      return this.popup
    },

    addLocation () {
      if (!this.enableSend) {
        return
      }

      this.startLoading()

      let address = this.getAddress()
      let coordinates = this.coordinates
      let description = this.getDescription()
      let name = this.getName()

      window.bus.$emit(config.ACTIONS.ADD_LOCATION, { coordinates, name, description, address })
    },
    login () {
      this.startLoading()

      let address = this.getAddress()
      let coordinates = this.coordinates
      let description = this.getDescription()
      let name = this.getName()
      let zoom = this.map.getZoom()

      window.bus.$emit(config.ACTIONS.LOGIN, { coordinates, zoom, name, description, address })
    },
    showSuccess () {
      this.popup.getContent().classList.add('was-successful')

      setTimeout(() => {
        this.hideSuccess()
      }, 1500)
    },
    hideSuccess () {
      this.popup.getContent().classList.remove('was-successful')
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
    enableSendButton () {
      if (this.popup && this.popup.getContent()) {
        this.popup.getContent().classList.add('can-send')
        this.enableSend = true
      }
    },
    disableSendButton () {
      if (this.popup && this.popup.getContent()) {
        this.popup.getContent().classList.remove('can-send')
        this.enableSend = false
      }
    },
    getName () {
      return document.body.querySelector('.js-name').textContent
    },
    getDescription () {
      return document.body.querySelector('.js-description').value
    },
    getAddress () {
      return document.body.querySelector('.js-address').textContent
    },
    setDescription (text) {
      document.body.querySelector('.js-description').value = text

      if (text && text.length) {
        this.enableSendButton()
      }
    },
    setAddress (text) {
      this.popup.getContent().querySelector('.js-address').textContent = text
      this.popup.getContent().classList.add('has-address')
    },

    parseAddress(address) {
      let parts = []

      let tpl = 'road, house_number, city, country'

      tpl.split(', ').forEach((part) => {
        if (address && address[part]) {
          parts.push(address[part])
        }
      })

      return parts.length ? parts.join(', ') : 'Mysterious location'
    },

    onGetGeocoding (response) {
      response.json().then((result) => {
        this.stopLoading()

        let name = (result.namedetails && result.namedetails.name) || address || result.display_name
        let address = (result && this.parseAddress(result.address)) || result.display_name
        this.setName(this.truncate(name, MAX_TITLE_LENGTH))
        this.setAddress(address)
      })
    },
    geocode () {
      this.startLoading()

      let lat = this.coordinates.lat
      let lng = this.coordinates.lng
      let extraParams = '&addressdetails=1&namedetails=1&extratags=1&zoom=18&format=json'

      let url = `${config.ENDPOINTS.NOMINATIM}${config.ENDPOINTS.GEOCODE_URL}?lat=${lat}&lon=${lng}${extraParams}`

      this.get(url)
        .then(this.onGetGeocoding.bind(this))
        .catch((error) => {
          console.error(error)
        })
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

