class AirPopup extends Popup {
  constructor (data) {
    super()
    this.templateData = data

    this.AIR_QUALITY_DESCRIPTION = ['muy mala', 'mala', 'regular', 'buena', 'muy buena']
    this.templateData.time = this.time()
    this.templateData.pollutants = this.templateData.pollutants.filter(p => p.quality)
    this.templateData.quality = this.quality()
    this.templateData.href = `https://www.google.com/maps/search/?api=1&query=${this.templateData.lat},${this.templateData.lng}`

    this.popup = L.popup({ className: 'Popup', offset: [0, 12] })
  }

  time () {
    let time = undefined

    this.templateData.pollutants.forEach((pollutant) => {
      if (pollutant.quality) {
        time = pollutant.quality.time
      }
    })

    return time ? `${time}h` : '???'
  }

  quality () {
    return this.AIR_QUALITY_DESCRIPTION[this.templateData.qualityIndex - 1]
  }

  template () {
    return `<div class="Popup__content">
    <div class="Popup__header"><%= name -%></div>
    <div class="Popup__body">
      <div class="Popup__description">La calidad del aire a las <strong><%= time -%></strong> es <strong><%= quality -%></strong>.</div>
      <div class="Popup__pollutants">
        <% pollutants.forEach((pollutant) => { %>
               <div class="Popup__pollutant">
                 <div class="Popup__pollutantName"><%= pollutant.name -%></div>
                 <div class="Popup__pollutantValue"><span><%= pollutant.quality.lastValue -%></span>
                   <span class="Popup__pollutantUnit">µg/m<sup> 3</sup>
                  </div>
               </div>
        <% }); %> 

        <div class="Popup__pollutantsInfo">
          <a class="Popup__pollutantHelp" href="https://github.com/javierarce/aire-madrid/wiki/How-are-quality-indexes-calculated" target="_blank">
            Más información</a>
        </div>
      </div>
      <a class="Popup__address" href="<%= href %>" target="_blank" title="Abrir en Google Maps"><%= address  %></a>
    </div>
  </div>`
  }

  render () {
    this.renderTemplate()
    this.$el.classList.add('is-air')
    return this.$el
  }
}

