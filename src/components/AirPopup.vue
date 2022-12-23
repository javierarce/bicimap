<template>
  <div class="AirStationPopup__content">
    <div class="AirStationPopup__header" v-html="station.name"></div>
    <div class="AirStationPopup__body">
      <div class="AirStationPopup__description" v-html="description"></div>
      <button class="AirStationPopup__more" v-if="!showPollutants" @click="togglePollutatns">Ver detalles</button>

      <div class="AirStationPopup__pollutants" v-if="showPollutants">

        <div class="AirStationPopup__pollutant" v-for="(pollutant) in pollutants" v-bind:key="pollutant.id">
          <div class="AirStationPopup__pollutantName" v-html="pollutant.name"></div>
          <div class="AirStationPopup__pollutantValue"><span v-html="pollutant.quality.lastValue"></span>
            <span class="AirStationPopup__pollutantUnit">µg/m<sup> 3</sup>
            </span>a las <span v-html="time"></span> </div>
        </div>

        <div class="AirStationPopup__pollutantsInfo">
          <a class="AirStationPopup__pollutantHelp" href="https://github.com/javierarce/aire-madrid/wiki/How-are-quality-indexes-calculated" target="_blank">
            Más información</a>
        </div>
      </div>
      <a class="AirStationPopup__address" :href="href" target="_blank" title="Abrir en Google Maps" v-html="station.address"> </a>
    </div>
  </div>
</template>
<script>
import mixins from '../mixins'

const AIR_QUALITY_DESCRIPTION = ['muy mala', 'mala', 'regular', 'buena', 'muy buena']

export default {
  mixins: [mixins],
  props: ['station'],
  data () {
    return {
      showPollutants: false
    }
  },
  computed: {
    pollutants () {
      return this.station.pollutants.filter(p => p.quality)
    },
    href () {
      return `https://www.google.com/maps/search/?api=1&query=${this.station.lat},${this.station.lng}`
    },
    time () {
      let time = undefined

      this.pollutants.forEach((pollutant) => {
        time = pollutant.quality.time
      })

      return time ? `${time}h` : '???'
    },

    quality () {
      return AIR_QUALITY_DESCRIPTION[this.station.qualityIndex - 1]
    },
    description () {
      return `La calidad del aire a las <strong>${this.time}</strong> es <strong>${this.quality}</strong>.`
    }
  },

  methods: {
    togglePollutatns () {
      this.showPollutants = !this.showPollutants
    }
  }
}
</script>

