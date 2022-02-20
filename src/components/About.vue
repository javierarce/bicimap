<template>
  <div class="About" @click="onClickOutside"> 
    <div class="About__inner has-transition" @click="onClickInside">
      <div class="About__title">Acerca de BiciMap</div>
      <div class="About__content">
        <div class="About__description">

          <p><strong @click="reload">BiciMap</strong> ofrece una alternativa amable y usable a los mapas de bicis oficiales de <a href="https://www.bicimad.com" target="_blank">BiciMAD</a> y <a href="https://bicing.barcelona/">Bicing</a>.</p>

          </div>

          <div class="About__highlight">
            <p>Sigue el desarrollo del proyecto, sugiere mejoras e informa de errores en GitHub.</p>
            <a href="https://github.com/javierarce/bicimap" class="Button About__button is-bold" title="Visita el repositorio en GitHub" target="_blank">Accede al código</a>
          </div>

          <p class="is-small">Esta web utiliza datos de <a href="https://www.openstreetmap.org/copyright" target="_blank">Nominatim</a>.</p>


        <div class="About__footer">
          <div>Actualizado hace <strong v-html="updatedAt"></strong></div>
          <div>Creado por <a href="https://twitter.com/javier" target="_blank">Javier Arce</a> sobre una bici</div>
        </div>
      </div>
    </div>
    <div class="About__backdrop"></div>
  </div>
</template>

<script>
import config from '../../config'

export default {
  props: ['updatedAt'],
  methods: {
    reload () {
      window.location.reload(true)
    },
    onClickOutside () {
      window.bus.$emit(config.ACTIONS.TOGGLE_ABOUT)
    },
    onClickInside (e) {
      if (e.target && e.target.tagName !== 'A') {
        e.stopPropagation()
        e.preventDefault()
      }
    }
  }
}
</script>

