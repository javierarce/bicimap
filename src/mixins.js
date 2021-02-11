import config from '../config'

const METHODS = {
  DELETE: 'DELETE',
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT'
}

const HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

export default {
  data () {
    return {
      localStorage: window.localStorage
    }
  },
  methods: {
    onError (e) {
      console.log('Error: ', e)
    },
    delete (url, body) {
      return window.fetch(url, {
        headers: HEADERS,
        method: METHODS.DELETE,
        body: JSON.stringify(body)
      })
    },
    put (url, body) {
      return window.fetch(url, {
        headers: HEADERS,
        method: METHODS.PUT,
        body: JSON.stringify(body)
      })
    },
    post (url, body) {
      return window.fetch(url, {
        headers: HEADERS,
        method: METHODS.POST,
        body: JSON.stringify(body)
      })
    },
    get (url) {
      return window.fetch(url, {
        headers: HEADERS,
        method: METHODS.GET
      })
    },
    coordinatesToLatLon (coordinates) {
      return [coordinates.lat, coordinates.lon]
    },
    latLonToCoordinates (latLon) {
      return { lat: latLon[0], lon: latLon[1] }
    },
    getDetails (id, data) {
      let url = `${config.ENDPOINTS.NOMINATIM}${config.ENDPOINTS.SEARCH_DETAILS_URL}?place_id=${id}&format=json`

      const onGetDetails = (response) => {
        this.onGetDetails(response, data)
      }

      this.get(url)
        .then(onGetDetails.bind(this))
        .catch((error) => {
          console.log(error)
        })
    },
    saveToLocalStorage (id, what) {
      if (this.localStorage) {
        this.localStorage.setItem(id, JSON.stringify(what))
      }
    },
    retrieveFromLocalStorage (id) {
      if (this.localStorage) {
        let what = this.localStorage.getItem(id)
        if (what) {
          return JSON.parse(what)
        }
      }
      return undefined
    },
    removeFromLocalStorage (id) {
      if (this.localStorage) {
        this.localStorage.removeItem(id)
      }
    },
    emptyLocalStorage () {
      if (this.localStorage) {
        this.localStorage.clear()
      }
    },
    pluralize (amount, singular, plural, options = {}) {
      let word = singular

      if (!amount || amount > 1)  {
        word = plural
      }

      if (options && options.showAmount === false) {
        return word
      } else {
        return `${amount} ${word}`
      }
    }
  }
}
