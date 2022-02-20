<template>
  <div class="BikeStationPopup__content">
    <div class="BikeStationPopup__header">
      <div class="Station__id" v-html="id"></div>
      <span v-html="street"></span>
    </div>
    <div class="BikeStationPopup__body">
      <div class="BikeStationPopup__description">
        <div class="Items">
          <div class="Item">
            <div class="Item__icon is-bike"></div>
            <div class="Item__amount" v-html="bikes"></div>
          </div>
          <div class="Item" v-if="isBarcelona">
            <div class="Item__icon is-ebike"></div>
            <div class="Item__amount" v-html="eBikes"></div>
          </div>
          <div class="Item">
            <div class="Item__icon is-base"></div>
            <div class="Item__amount" v-html="bases"></div>
          </div>
        </div>
      </div>
      <div class="BikeStationPopup__footer">
        <a class="BikeStationPopup__address" :href="href" target="_blank" title="Abrir en Google Maps" v-html="address"></a>
      </div>
    </div>
  </div>
</template>

<script>
import mixins from '../mixins'
import config from '../../config'

export default {
  mixins: [mixins],
  props: ['location', 'city'],
  computed: {
    isBarcelona () {
      return this.city === 'barcelona'
    },
    href () {
      return `https://www.google.com/maps/place/${this.address}, ${this.city}/${this.location.latitude},${this.location.longitude},17z`
    },
    address () {
      let value = this.city === 'madrid' ? this.location.address : this.location.streetName
      return value.replace('C/', '').replace('Calle', '').replace(/\(.*?\)/, '')
    },
    bases () {
      return this.city === 'madrid' ? this.location.free_bases : this.location.slots
    },
    basesLabel () {
      return this.pluralize(location.free_bases, 'base', 'bases', { showAmount: false })
    },
    eBikes () {
      return this.location.electrical_bikes
    },
    eBikesLabel () {
      return this.pluralize(location.electrical_bikes, 'e-bici', 'e-bicis', { showAmount: false })
    },
    bikes () {
      return this.city === 'madrid' ? this.location.dock_bikes : this.location.mechanical_bikes
    },
    bikesLabel () {
      return this.pluralize(this.bikes, 'bici', 'bicis', { showAmount: false })
    },
    id () {
      return this.city === 'madrid' ? this.location.number : this.location.id
    },
    street () {
      let value = this.city === 'madrid' ? this.location.name : this.location.streetName
      return value.replace('C/', '').replace('Calle', '')
    }
  },
  methods: {
    onClickDirection () {
      window.bus.$emit(config.ACTIONS.ADD_POINT, [this.location.latitude, this.location.longitude])
    }
  }
}
</script>
