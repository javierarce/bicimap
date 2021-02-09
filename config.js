const TEXTS = {
  PLACEHOLDER: 'What\'s cool about this place?',
  SEARCH_PLACEHOLDER: 'Search for a place or an address',
  NO_RESULTS_TITLE:  'Oh, no… we couldn’t find "{q}."',
  NO_RESULTS_DESCRIPTION: `<p><strong>Map with Me</strong> uses data from <a href="https://www.openstreetmap.org">OpenStreetMap</a> 
  (a collaborative project which aims to create a free editable map of the world) and that place hasn’t been added yet.</p>
  <p>But the good news is that you can add it to OSM yourself and help improve a free and open map of the world! Visit <a href="https://www.openstreetmap.org">OSM</a>, zoom to an area, and click "edit".</p>`,
}

const ACTIONS = {
  ADD_LOCATION: 'add-location',
  ADD_LOCATIONS: 'add-locations',
  REMOVE_MARKER: 'remove-marker',
  ADD_MARKER: 'add-marker',
  ADD_MARKERS: 'add-markers',
  CHANGE_MODE: 'change-mode',
  INVALIDATE_MAP_SIZE: 'invalidate-size',
  LOGGED_IN: 'logged-in',
  LOGIN: 'login',
  ON_LOAD: 'on-load',
  SELECT_MARKER: 'select-marker',
  SET_VIEW: 'set-view',
  SHOW_ADDED_LOCATION: 'show-added-location',
  SHOW_DEFAULT_POINT: 'show-default-point',
  SHOW_SAVED_LOCATION: 'show-saved-location',
  START_LOADING: 'start-loading',
  STOP_LOADING: 'stop-loading',
  TOGGLE_DESTROY: 'toggle-destroy',
  TOGGLE_ABOUT: 'toggle-about',
  TOGGLE_CONFIG: 'toggle-config',
  TOGGLE_ALERT: 'toggle-alert',
  TOGGLE_MAP_SIZE: 'toggle-map-size',
  UPDATED_AT: 'updated-at',
  VISIT_MARKER: 'visit-marker'
}

/* BE CAREFUL WHEN CHANGING THESE SETTINGS */

const ENDPOINTS = {
  LOCATIONS: '/api/stations',
  CONFIG: '/api/config'
}

module.exports = { 
  ACTIONS,
  ENDPOINTS,
  TEXTS
}
