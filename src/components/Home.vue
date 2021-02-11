<template>
  <div class="App">
    <transition name="slide-fade">
    <Alert v-if="showAlert" :title="alertTitle" :description="alertDescription" :footer="alertFooter" />
    </transition>

    <transition name="slide-fade">
    <About v-if="showAbout" />
    </transition>

    <Header />
    <Map />
  </div>
</template>

<script>
import mixins from '../mixins'
import config from '../../config'

import About from './About.vue'
import Alert from './Alert.vue'
import Header from './Header.vue'
import Map from './Map.vue'

import { formatDistance } from 'date-fns'
import { es } from 'date-fns/locale';

export default {
  mixins: [mixins],
  components: {
    About,
    Alert,
    Header,
    Map,
  },
  data () {
    return {
      alertDescription: undefined,
      alertFooter: undefined,
      alertTitle: undefined,
      locations: [],
      showAbout: false,
      showAlert: false
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.bindEvents()
      this.getStations()
    })
  },
  methods: {
    bindEvents () {
      window.bus.$off(config.ACTIONS.LOGIN)
      window.bus.$off(config.ACTIONS.ON_LOAD)
      window.bus.$off(config.ACTIONS.START_LOADING)
      window.bus.$off(config.ACTIONS.STOP_LOADING)
      window.bus.$off(config.ACTIONS.TOGGLE_ABOUT)
      window.bus.$off(config.ACTIONS.TOGGLE_ALERT)
      window.bus.$off(config.ACTIONS.SHOW_ALERT)

      window.bus.$on(config.ACTIONS.LOGIN, this.onLogin)
      window.bus.$on(config.ACTIONS.ON_LOAD, this.onLoad)
      window.bus.$on(config.ACTIONS.START_LOADING, this.onStartLoading)
      window.bus.$on(config.ACTIONS.STOP_LOADING, this.onStopLoading)
      window.bus.$on(config.ACTIONS.TOGGLE_ABOUT, this.onToggleAbout)
      window.bus.$on(config.ACTIONS.TOGGLE_ALERT, this.onToggleAlert)
      window.bus.$on(config.ACTIONS.SHOW_ALERT, this.onShowAlert)

      document.onkeyup = this.onKeyUp
    },
    onKeyUp (e) {
      e.preventDefault()
      e.stopPropagation()

      if (e.keyCode === 27) {
        this.showAlert = false
        this.showAbout = false
      }
    },
    onLoad () {
      document.body.classList.add('is-loaded')
    },
    onGetLocations (response) {
      response.json().then((data) => {

        let updatedAt = formatDistance(data.updated_at, new Date(),  { locale: es })
        window.bus.$emit(config.ACTIONS.UPDATED_AT, updatedAt)
        window.bus.$emit(config.ACTIONS.ADD_STATIONS, data.stations)
      })
    },
    onStartLoading () {
      document.body.classList.add('is-loading')
    },
    onStopLoading () {
      document.body.classList.remove('is-loading')
    },
    onToggleAbout () {
      this.showAbout = !this.showAbout
    },
    onShowAlert (title, description, footer) {
      this.showAlert = true
      this.alertTitle = title
      this.alertDescription = description
      this.alertFooter = footer
    },
    onToggleAlert (title, description, footer) {
      this.showAlert = !this.showAlert
      this.alertTitle = title
      this.alertDescription = description
      this.alertFooter = footer
    },
    getStations () {
      this.get('/stations.json')
        .then(this.onGetLocations.bind(this))
        .catch((error) => {
          console.error(error)
        })
    }
  }
}
</script>
