const MAP = {
  TITLE: 'Bicimap',
  LAT: "40.41948626649347",
  LON: "-3.6930539666172475",
  ZOOM: "14",
  DEFAULT_SEARCH_LOCATION: "Madrid, Spain"
}

const TEXTS = {
  SEARCH_PLACEHOLDER: 'Busca por dirección o comercio',
  NO_RESULTS_TITLE:  'Dirección no encontrada',
  NO_RESULTS_DESCRIPTION: `<p><strong>Bicimap</strong> usa datos públicos de <a href="https://www.openstreetmap.org">OpenStreetMap</a>  y la dirección que has buscado ({q}) aún no se ha agregado.</p>`,
}

const ACTIONS = {
  ADD_MARKER: 'add-marker',
  ADD_MARKERS: 'add-markers',
  ADD_POINT: 'add-point',
  ADD_STATION: 'add-station',
  ADD_STATIONS: 'add-stations',
  OPEN_ABOUT: 'open-about',
  SELECT_MARKER: 'select-marker',
  SET_VIEW: 'set-view',
  SHOW_ALERT: 'show-alert',
  START_LOADING: 'start-loading',
  STOP_LOADING: 'stop-loading',
  TOGGLE_ABOUT: 'toggle-about',
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
