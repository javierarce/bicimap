"use strict";

import Vue from 'vue'
import VueRouter from 'vue-router'

const Home = require('./components/Home.vue').default
const App = require('./app.vue').default

import config from '../config'

import './assets/scss/style.scss?v=1.3'
import './registerServiceWorker'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home, name: 'Home' }
  ]
})

window.bus = new Vue({
  data () {
    return {
      markers: [],
      user: undefined
    }
  },
  methods: {
    getTitle () {
      return config.MAP.TITLE
    }
  }
})

new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
