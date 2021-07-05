const MAP = {
  TITLE: 'BiciMap',
  LAT: "40.41948626649347",
  LON: "-3.6930539666172475",
  ZOOM: "14",
  DEFAULT_SEARCH_LOCATION: "Madrid"
}

const TEXTS = {
  SEARCH_PLACEHOLDER: 'Busca por dirección o comercio',
  NO_RESULTS_TITLE:  'Oh, no… we couldn’t find "{q}."',
  NO_RESULTS_DESCRIPTION: `<p><strong>Map with Me</strong> uses data from <a href="https://www.openstreetmap.org">OpenStreetMap</a> 
  (a collaborative project which aims to create a free editable map of the world) and that place hasn’t been added yet.</p>
  <p>But the good news is that you can add it to OSM yourself and help improve a free and open map of the world! Visit <a href="https://www.openstreetmap.org">OSM</a>, zoom to an area, and click "edit".</p>`,
}

const ACTIONS = {
  ADD_MARKER: 'add-marker',
  ADD_MARKERS: 'add-markers',
  ADD_STATION: 'add-location',
  ADD_STATIONS: 'add-locations',
  SELECT_MARKER: 'select-marker',
  SET_VIEW: 'set-view',
  SHOW_ALERT: 'show-alert',
  START_LOADING: 'start-loading',
  STOP_LOADING: 'stop-loading',
  TOGGLE_ABOUT: 'toggle-about',
  OPEN_ABOUT: 'open-about',
  TOGGLE_ALERT: 'toggle-alert',
  TOGGLE_LANES: 'toggle-lanes',
  UPDATED_AT: 'updated-at'
}

const ENDPOINTS = {
  NOMINATIM: 'https://nominatim.openstreetmap.org',
  SEARCH_URL: '/search.php'
}

module.exports = { 
  MAP,
  ENDPOINTS,
  TEXTS,
  ACTIONS
}
