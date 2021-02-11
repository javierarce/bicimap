"use strict";

import Vue from 'vue'
import VueRouter from 'vue-router'

const Home = require('./components/Home.vue').default
const App = require('./app.vue').default

import config from '../config'

import './assets/scss/style.scss'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home, name: 'Home' },
    { path: '/admin/:secret', component: Home, name: 'Admin' }
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
    isLoggedIn () {
      return !!(this.user && this.user.username)
    },
    isAdmin () {
      return !!(this.user && this.user.username && config.ADMIN.ADMIN_USERNAME === this.user.username)
    },
    getTitle () {
      return config.MAP.TITLE
    },
    getAdminUsername () {
      return config.ADMIN.ADMIN_USERNAME
    },
    isModerated () {
      return config.ADMIN.MODERATED
    },
    isAnonymous () {
      return config.ADMIN.ANONYMOUS
    },
    isProtected () {
      return config.ADMIN.PROTECTED
    }
  }
})

new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
