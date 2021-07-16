<template>
  <div class="BikeStationPopup__content">
    <div class="BikeStationPopup__header">
      <div class="Station__id" v-html="location.number"></div>
      <span v-html="location.name"></span>
    </div>
    <div class="BikeStationPopup__body">
      <div class="BikeStationPopup__description">
        <div class="Items">
          <div class="Item">
            <div class="Item__amount" v-html="location.dock_bikes"></div>
            <div class="Item__title" v-html="bikes"></div>
          </div>
          <div class="Item">
            <div class="Item__amount" v-html="location.free_bases"></div>
            <div class="Item__title" v-html="bases"></div>
          </div>
        </div>
      </div>
      <div class="BikeStationPopup__footer">
        <a class="BikeStationPopup__address" :href="href" target="_blank" title="Abrir en Google Maps" v-html="location.address"></a>
        <button class="BikeStationPopup__button Button is-small" @click="onClickDirection" v-if="false">Dirección</button>
      </div>
    </div>
  </div>
</template>

<script>
import mixins from '../mixins'
import config from '../../config'

export default {
  mixins: [mixins],
  props: ['location'],
  computed: {
    href () {
      return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
    },
    bases () {
      return this.pluralize(location.free_bases, 'base libre', 'bases libres', { showAmount: false })
    },
    bikes () {
      return this.pluralize(location.dock_bikes, 'bicicleta', 'bicicletas', { showAmount: false })
    }
  },
  methods: {
    onClickDirection () {
      window.bus.$emit(config.ACTIONS.ADD_POINT, [this.location.latitude, this.location.longitude])
    }
  }
}
</script>
