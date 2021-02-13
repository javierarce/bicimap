<template>
  <div class="App">
    <transition name="slide-fade">
    <Alert v-if="showAlert" :title="alertTitle" :description="alertDescription" :footer="alertFooter" />
    </transition>

    <transition name="slide-fade">
    <About :updatedAt="updatedAt" v-if="showAbout" />
    </transition>

    <Map />
  </div>
</template>

<script>
import mixins from '../mixins'
import config from '../../config'

import About from './About.vue'
import Alert from './Alert.vue'
import Map from './Map.vue'

import { formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'

export default {
  mixins: [mixins],
  components: {
    About,
    Alert,
    Map,
  },
  data () {
    return {
      alertDescription: undefined,
      alertFooter: undefined,
      alertTitle: undefined,
      locations: [],
      updatedAt: undefined,
      showAbout: false,
      showAlert: false
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.bindEvents()
      this.loadStations()
      window.home = this
    })
  },
  methods: {
    bindEvents () {
      window.bus.$off(config.ACTIONS.START_LOADING)
      window.bus.$off(config.ACTIONS.STOP_LOADING)
      window.bus.$off(config.ACTIONS.TOGGLE_ABOUT)
      window.bus.$off(config.ACTIONS.OPEN_ABOUT)
      window.bus.$off(config.ACTIONS.TOGGLE_ALERT)
      window.bus.$off(config.ACTIONS.SHOW_ALERT)

      window.bus.$on(config.ACTIONS.START_LOADING, this.onStartLoading)
      window.bus.$on(config.ACTIONS.STOP_LOADING, this.onStopLoading)
      window.bus.$on(config.ACTIONS.TOGGLE_ABOUT, this.onToggleAbout)
      window.bus.$on(config.ACTIONS.OPEN_ABOUT, this.onOpenAbout)
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
    onGetStations (response) {
      response.json().then((data) => {
        this.updatedAt = formatDistance(data.updated_at, new Date(),  { locale: es })
        window.bus.$emit(config.ACTIONS.ADD_STATIONS, data.stations)
      })
    },
    onStartLoading () {
      document.body.classList.add('is-loading')
    },
    onStopLoading () {
      document.body.classList.remove('is-loading')
    },
    onOpenAbout () {
      this.showAbout = true
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
    loadStations () {
      console.log('loading stations')
      this.getStations()

//      setInterval(() => {
//        this.getStations()
//      }, 60 * 1000)
    },
    getStations () {
      console.log('Getting stations.')
      this.get(`/stations.json?r=${Math.random() * 10000}`)
        .then(this.onGetStations.bind(this))
        .catch((error) => {
          console.error(error)
        })
    }
  }
}
</script>
