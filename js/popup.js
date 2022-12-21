class Popup extends Base {
  constructor (station) {
    super()
    this.templateData = station
    this.popup = L.popup({ className: 'Popup', offset: [0, 12] })
  }

  template () {
    return `<div class="Popup__content">
        <div class="Popup__header">
          <div class="Station__id"><%= id -%></div>
          <span><%= name -%></span>
        </div>
        <div class="Popup__body">
        <div class="Popup__description">
        <div class="Items">
          <div class="Item">
          <div class="Item__icon is-bike"></div>
          <div class="Item__amount"><%= mechanical -%></div>
       </div>
       <% if (electric !== null) { %>
        <div class="Item">
          <div class="Item__icon is-ebike"></div>
          <div class="Item__amount"><%= electric -%></div>
      </div>
      <% } %>
      <div class="Item">
        <div class="Item__icon is-base"></div>
        <div class="Item__amount"><%= bases -%></div>
      </div>
      </div>
      </div>
      <div class="Popup__footer">
      <a href="https://www.google.com/maps/place/<%= address -%>, <%= city -%>/<%= lat -%>,<%= lng -%>, <%= zoom -%>z" target="_blank" title="Abrir en Google Maps" class="Popup__address"><%= address -%></a>
      </div>
      </div>
      </div>`
  }

  render () {
    this.renderTemplate()
    return this.$el
  }
}

