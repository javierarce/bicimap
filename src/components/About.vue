<template>
  <div class="About" @click="onClickOutside"> 
    <div class="About__backdrop"></div>
    <div class="About__inner has-transition" @click="onClickInside">
      <div class="About__title">Acerca de este proyecto</div>
      <div class="About__content">
        <div class="About__description">
          
          <p><strong>BiciMap</strong> es un mapa no oficial y de código abierto del servicio de alquiler de bicicletas <a href="https://www.bicimad.com" target="_blank">BiciMAD</a> de Madrid.</p>

          <p>Sigue el desarrollo de este proyecto, sugiere mejoras e informa de errores en GitHub.</p>
          <a href="https://github.com/javierarce/bicimap" class="Button About__button is-bold" title="Visita el repositorio en GitHub" target="_blank">Visita el repositorio de código</a>

        </div>


        <div class="About__footer">
          <div>Datos actualizados hace <strong v-html="updatedAt"></strong></div>
          <div>Creado por <a href="https://twitter.com/javier" target="_blank">Javier Arce</a> sobre una bicicleta.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../../config'

export default {
  props: ['updatedAt'],
  methods: {
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

