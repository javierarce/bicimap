<template>
  <div class="Search">
    <div class="Search__content">
      <input type="text" class="Search__input" :placeholder="placeholder" ref="search" v-on:keyup="onKeyUp" v-on:keyup.enter="onSubmit" :value="q" />
      <div class="Spinner Search__spinner"></div>
      <button class="Search__clean" @click="onClean"></button>
    </div>
  </div>
</template>

<script>

import mixins from '../mixins'
import config from '../../config'

export default {
  mixins: [mixins],
  data () {
    return {
      placeholder: config.TEXTS.SEARCH_PLACEHOLDER,
      q: undefined
    }
  },

  watch: {
    q (value) {
      if (value) {
        this.$el.classList.add('is-filled')
      } else {
        this.$el.classList.remove('is-filled')
      }
    }
  },
  methods: {
    onKeyUp () {
      this.q = this.$refs.search.value
    },

    onClean (e) {
      e.preventDefault()
      e.stopPropagation()
      this.q = ''
    },

    onSubmit (e) {
      e.preventDefault()
      e.stopPropagation()

      this.search()
    },
    search () {
      if (!this.q) {
        return
      }

      let extraParams = '&polygon_geojson=1&format=json&addressdetails=1&namedetails=1&extratags=1'
      let url = `${config.ENDPOINTS.NOMINATIM}${config.ENDPOINTS.SEARCH_URL}?q=${this.q}, ${config.MAP.DEFAULT_SEARCH_LOCATION}${extraParams}`
      this.$el.classList.add('is-searching')
      window.bus.$emit(config.ACTIONS.START_LOADING)

      this.get(url)
        .then(this.onGetResult)
        .catch((error) => {
          console.log(error)
        })
    },
    onGetResult (response) {
      response.json().then((results) => {
        this.$el.classList.remove('is-searching')
        window.bus.$emit(config.ACTIONS.STOP_LOADING)

        if (results.length) {
          window.bus.$emit(config.ACTIONS.SET_VIEW, results[0])
        } else {
          let title = config.TEXTS.NO_RESULTS_TITLE
          let description = config.TEXTS.NO_RESULTS_DESCRIPTION.replace('{q}', this.q)
          let footer = `<a class="Button Alert__button" href="https://www.openstreetmap.org/search?query=${this.q}#map=${config.MAP.ZOOM}/${config.MAP.LAT}/${config.MAP.LON}" target="__blank">Añade este lugar en OSM</a>`
          window.bus.$emit(config.ACTIONS.TOGGLE_ALERT, title, description, footer)
        }
      })
    }
  }
}
</script>

