const MAP = {
  TITLE: 'BiciMap',
  LAT: "40.41948626649347",
  LON: "-3.6930539666172475",
  ZOOM: "14"
}

const TEXTS = {
  PLACEHOLDER: 'What\'s cool about this place?',
  SEARCH_PLACEHOLDER: 'Search for a place or an address',
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
  INVALIDATE_MAP_SIZE: 'invalidate-size',
  LOGGED_IN: 'logged-in',
  LOGIN: 'login',
  ON_LOAD: 'on-load',
  SELECT_MARKER: 'select-marker',
  SET_VIEW: 'set-view',
  SHOW_ADDED_STATION: 'show-added-location',
  SHOW_ALERT: 'show-alert',
  SHOW_DEFAULT_POINT: 'show-default-point',
  SHOW_SAVED_STATION: 'show-saved-location',
  START_LOADING: 'start-loading',
  STOP_LOADING: 'stop-loading',
  TOGGLE_ABOUT: 'toggle-about',
  OPEN_ABOUT: 'open-about',
  TOGGLE_ALERT: 'toggle-alert',
  TOGGLE_CONFIG: 'toggle-config',
  TOGGLE_DESTROY: 'toggle-destroy',
  TOGGLE_LANES: 'toggle-lanes',
  UPDATED_AT: 'updated-at'
}

/* BE CAREFUL WHEN CHANGING THESE SETTINGS */

const ENDPOINTS = {
  CONFIG: '/api/config'
}

module.exports = { 
  MAP,
  ACTIONS,
  ENDPOINTS,
  TEXTS
}
