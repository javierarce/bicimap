const MAP = {
  TITLE: 'BiciMap',
  LAT: "40.41948626649347",
  LON: "-3.6930539666172475",
  ZOOM: "14"
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

module.exports = { 
  MAP,
  ACTIONS
}
