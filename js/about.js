class About extends Base {
  constructor () {
    super()
    this.render()
  }

  bindEvents () {
    this.$el.onclick = (event) => {
      console.log('click')
      if (event.target.className === 'About__backdrop') {
        this.hide()
      }
    }
  }

  template () {
    return `<div class="About"> 
    <div class="About__inner has-transition">
      <div class="About__title">Acerca de este proyecto</div>
      <div class="About__content">
        <div class="About__description">

          <p><strong @click="reload">BiciMap</strong> es un mapa no oficial y de código abierto del servicio de alquiler de bicicletas <a href="https://www.bicimad.com" target="_blank">BiciMAD</a> de Madrid.</p>

          <p>Este proyecto trata de ofrecer una alternativa amable y usable al mapa de estaciones oficial.</p>
          </div>

          <div class="About__highlight">
            <p>Sigue el desarrollo de este mapa, sugiere mejoras e informa de errores en GitHub.</p>
            <a href="https://github.com/javierarce/bicimap" class="Button About__button is-bold" title="Visita el repositorio en GitHub" target="_blank">Visita el repositorio de código</a>
          </div>


        <div class="About__footer">
          <div>Actualizado hace <strong v-html="updatedAt"></strong></div>
          <div>Creado por <a href="https://twitter.com/javier" target="_blank">Javier Arce</a> sobre una bici</div>
        </div>
      </div>
    </div>
    <div class="About__backdrop"></div>
  </div>`
  }

  hide () {
    this.$el.remove()
  }

  show () {
    document.body.prepend(this.$el)
  }

  render () {
    this.renderTemplate()
    this.bindEvents()

    return this.$el
  }
}
