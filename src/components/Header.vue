<template>
  <div class="Header">
    <div class="Header__info">
      <button class="Button Header__title" @click="onClickTitle" v-html="title"></button>
      <div class="Header__updatedAt" v-html="updatedAt" v-if="updatedAt"></div>
      <Toggle defaultText="Coger" activeText="Dejar" @state="onToggle"/>
    </div>
    <div class="Header__links">
      <button class="Button Header__linksItem" @click="onClickAbout">Acerca de</button>
    </div>
  </div>
</template>

<script>

import mixins from '../mixins'
import config from '../../config'
import mapConfig from '../../map.yaml'

import Toggle from './Toggle.vue'

export default {
  mixins: [mixins],
  components: {
    Toggle
  },
  data() {
    return {
      canLogin: false,
      title: window.bus.getTitle(),
      updatedAt: false,
      loggedIn: false,
      username: undefined,
      avatarURL: undefined
    }
  },
  mounted () {
    this.$nextTick(() => {
      config.MAP = mapConfig.map
      this.canLogin = !window.bus.isAnonymous()

      this.bindEvents()
    })
  },
  methods: {
    onToggle (state) {
      window.bus.$emit(config.ACTIONS.CHANGE_MODE, state)
    },
    bindEvents () {
      window.bus.$off(config.ACTIONS.LOGGED_IN)
      window.bus.$off(config.ACTIONS.UPDATED_AT)

      window.bus.$on(config.ACTIONS.LOGGED_IN, this.onLoggedIn, this)
      window.bus.$on(config.ACTIONS.UPDATED_AT, this.onUpdatedAt, this)
    },
    onClickTitle () {
      window.bus.$emit(config.ACTIONS.SHOW_DEFAULT_POINT)
    },
    onClickConfig () {
      window.bus.$emit(config.ACTIONS.TOGGLE_CONFIG)
    },
    onClickAbout () {
      window.bus.$emit(config.ACTIONS.TOGGLE_ABOUT)
    },
    onClickLogin () {
      if (window.bus.isLoggedIn()) {
        console.log('logout') // TODO
      } else {
        window.location.href = config.ENDPOINTS.LOGIN_PATH
      }
    },
    onUpdatedAt (text) {
      this.updatedAt = `actualizado hace ${text}`
    },
    onLoggedIn () {
      this.loggedIn = window.bus.isLoggedIn()

      if (this.loggedIn) {
        this.avatarURL = window.bus.user.profileImage
        this.username = `@${window.bus.user.username}`
      }
    }
  }
}
</script>
