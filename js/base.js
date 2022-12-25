class Base {
  constructor () {
    this.className = this.constructor.name
    this.templateData = {}
  }

  killEvent (event) {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  isEmpty (obj) {
    return Object.keys(obj).length === 0;
  }

  get (URL, content) {
    const headers = { 'Content-Type': 'application/json' }
    const method = 'GET'
    const options = { method, headers }

    return fetch(URL, options)
  }

  post (URL, content) {
    const headers = { 'Content-Type': 'application/json' }
    const method = 'POST'
    const body = JSON.stringify(content)
    const options = { method, headers, body }

    return fetch(URL, options)
  }

  createElement ({ className, html, text, elementType = 'div', type,  ...options }) {
    let $el = document.createElement(elementType)

    if (type) {
      $el.type = 'text'
    }

    if (html) {
      $el.innerHTML = html
    } else if (text) {
      $el.innerText = text
    }

    className.split(' ').filter(c => c).forEach(name => $el.classList.add(name))

    if (!this.isEmpty(options)) {
      Object.keys(options).forEach((key) => {
        $el[key] = options[key]
      })
    }

    return $el
  }

  template () {
    return `<div class="Template"></div>`
  }

  renderTemplate () {
    let className = this.className
    this.$el = this.createElement({ className })
    const html = ejs.render(this.template(), this.templateData)
    this.$el.insertAdjacentHTML('beforeend', html)
  }

  on (name, callback) {
    const $el = this.$el || document.body

    $el.addEventListener(name, (e) => {
      callback && callback(e.detail)
    })
  }

  emit (name, data) {
    if (!name) {
      console.error('Error: empty name event')
      return
    }

    let event = undefined

    if (data) {
      event = new CustomEvent(name, { detail: data })
    } else {
      event = new Event(name)
    }

    const $el = this.$el || document.body
    $el.dispatchEvent(event)
  }

  saveToLocalStorage (id, what) {
    if (window.localStorage) {
      window.localStorage.setItem(id, JSON.stringify(what))
    }
  }

  retrieveFromLocalStorage (id) {
    if (window.localStorage) {
      let what = window.localStorage.getItem(id)
      if (what) {
        return JSON.parse(what)
      }
    }
    return undefined
  }

  removeFromLocalStorage (id) {
    if (window.localStorage) {
      window.localStorage.removeItem(id)
    }
  }

  emptyLocalStorage () {
    if (window.localStorage) {
      window.localStorage.clear()
    }
  }

  render () {
    this.renderTemplate()
    return this.$el
  }
}
