class UserPopup extends Popup {
  constructor (location, mode, closestMarker) {
    super()
    this.closestMarker = closestMarker.marker
    const station = this.closestMarker.options.station
    this.templateData = station
    this.templateData.mode = mode === MODE_BIKES ? 'bicis' : 'bases'
    this.popup = L.popup({ className: 'Popup', offset: [0, 12] })
  }

  setContent (location, mode, closestMarker) {
    this.closestMarker = closestMarker.marker
    const station = this.closestMarker.options.station
    this.templateData = station
    this.templateData.mode = mode === MODE_BIKES ? 'bicis' : 'bases'
    this.popup.setContent(this.render())
  }

  template () {
    return `<div class="Popup__content">
    <div class="Popup__header">Usted se encuentra aquí</div>
    <div class="Popup__body">
      <div class="Popup__description">La estación más cercana con al menos 3 <%= mode -%> es <strong><%= id -%> - <%= name -%></strong></div>
      <div class="Popup__address"><%= address -%></div>
      <div class="Popup__action"><button class="Button is-small js-go">Ir a la estación<button></div>
    </div>
  </div>`
  }

  render () {
    this.renderTemplate()
    this.$el.querySelector('.js-go').onclick = (event) => {
      this.killEvent(event)
      this.emit('visit-marker', this.closestMarker)
    }
    this.$el.classList.add('is-user')
    return this.$el
  }
}
