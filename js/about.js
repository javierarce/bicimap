class About extends Base {
  constructor () {
    super()
    this.timestamp = 0
    this.templateData.timestamp = this.timestamp
    this.render()
  }

  bindEvents () {
    this.$el.onclick = (event) => {
      if (event.target.className === 'About__backdrop') {
        this.hide()
      }
    }
  }

  template () {
    return `<div class="About__inner has-transition">
      <div class="About__title">Acerca de este proyecto</div>
      <div class="About__content">


<p><strong>Bicimap</strong> ofrece una alternativa amable y usable a los mapas de bicis oficiales de BiciMAD y Bicing.</p>

          <div class="About__highlight">
            <p>Sigue el desarrollo del proyecto, sugiere mejoras e informa de errores en GitHub.</p>
            <a href="https://github.com/javierarce/bicimap" class="Button About__button is-bold" title="Visita el repositorio en GitHub" target="_blank">Visita el repositorio de código</a>
          </div>


        <div class="About__footer">
          <div>Actualizado hace <strong class="js-date"><%= timestamp -%></strong></div>
          <div>Creado por <a href="https://javier.computer" target="_blank">Javier Arce</a> sobre una bici</div>
        </div>

    </div>
    </div>
    <div class="About__backdrop"></div>`
  }

  hide () {
    this.$el.remove()
  }

  show () {
    document.body.prepend(this.$el)
  }

  setUpdatedAt (timestamp) {
    if (timestamp > this.timestamp) {
      this.timestamp = timestamp
    }

    this.$el.querySelector('.js-date').innerText = this.distance(this.timestamp)
  }

  distance (timestamp) {
    const now = new Date().getTime()
    const howLongAgo = timestamp - now

    const getHumanTime = (timestamp) => {

      const time = Math.abs(timestamp)
      let humanTime, units

      if (time > (1000 * 60 * 60 * 24 * 365)) {
        humanTime = parseInt(time / (1000 * 60 * 60 * 24 * 365), 10)
        units = humanTime == 1 ? 'año' : 'años'
      } else if (time > (1000 * 60 * 60 * 24 * 30)) {
        humanTime = parseInt(time / (1000 * 60 * 60 * 24 * 30), 10)
        units = humanTime == 1 ? 'mes' : 'meses'
      } else if (time > (1000 * 60 * 60 * 24 * 7)) {
        humanTime = parseInt(time / (1000 * 60 * 60 * 24 * 7), 10)
        units = humanTime == 1 ? 'semana' : 'semanas'
      } else if (time > (1000 * 60 * 60 * 24)) {
        humanTime = parseInt(time / (1000 * 60 * 60 * 24), 10)
        units = humanTime == 1 ? 'día' : 'días'
      } else if (time > (1000 * 60 * 60)) {
        humanTime = parseInt(time / (1000 * 60 * 60), 10)
        units = humanTime == 1 ? 'hora' : 'horas'
      } else if (time > (1000 * 60)) {
        humanTime = parseInt(time / (1000 * 60), 10)
        units = humanTime == 1 ? 'minuto' : 'minutos'
      } else {
        humanTime = parseInt(time / (1000), 10)
        units = humanTime == 1 ? 'segundo' : 'segundos'
      }

      const timeUnits = humanTime + ' ' + units

      if (timestamp > 0) {
        return 'error'
      }

      return timeUnits
    }

    return getHumanTime(howLongAgo)

  }

  render () {
    this.renderTemplate()
    this.bindEvents()

    return this.$el
  }
}
