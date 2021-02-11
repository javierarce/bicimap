<template>
  <div class="Header">
    <div class="Header__info">
      <button class="Button Header__title" @click="onClickTitle" v-html="title"></button>
      <div class="Header__updatedAt" v-html="updatedAt" v-if="updatedAt"></div>
    </div>
    <div class="Header__links">
      <button class="Button Header__linksItem" @click="onClickAbout">Acerca de</button>
    </div>
  </div>
</template>

<script>

import mixins from '../mixins'
import config from '../../config'

export default {
  mixins: [mixins],
  data() {
    return {
      title: window.bus.getTitle(),
      updatedAt: false
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.bindEvents()
    })
  },
  methods: {
    bindEvents () {
      window.bus.$off(config.ACTIONS.UPDATED_AT)
      window.bus.$on(config.ACTIONS.UPDATED_AT, this.onUpdatedAt, this)
    },
    onClickTitle () {
      window.bus.$emit(config.ACTIONS.SHOW_DEFAULT_POINT)
    },
    onClickAbout () {
      window.bus.$emit(config.ACTIONS.TOGGLE_ABOUT)
    },
    onUpdatedAt (text) {
      this.updatedAt = `actualizado hace ${text}`
    }
  }
}
</script>
