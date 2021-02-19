'use strict'

import Vue from 'vue'
import App from './components/Home.vue'

import './assets/scss/style.scss'
import './registerServiceWorker?v=1.4'

window.bus = new Vue({
  data () {
    return {
      markers: []
    }
  }
})

new Vue({
  el: '#app',
  render: h => h(App)
})
