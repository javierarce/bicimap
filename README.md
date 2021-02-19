# BiciMap

🌍 Unofficial map of BiciMAD stations. 

This is my attempt to make a more useful and nicer version of the [current BiciMAD map](https://u.bicimad.com/mapa).

![card](public/img/card.png)

### HOW TO INSTALL IT

- Clone this repo: `git clone git@github.com:javierarce/bicimap.git`
- Install dependecies: `cd bicimap; yarn`
- Download stations: `node public/stations.js`
- Run server: `yarn serve`
- Follow the instructions in your terminal

### TODO

- [ ] Add tooltips for the map controllers
- [ ] Fix error alerts

### WISHLIST

- [ ] Add air quality information
- [ ] Add weather information
- [ ] Allow marking stations as favorites for easier access
- [ ] Add routing between stations
- [ ] Show nearby stations to a given station

### DONE

- [x] Create PWA
- [x] Add screenshot/GIF in this documentation
- [x] Add station refresh on a set interval
- [x] Add installation instructions
- [x] Fix popup issues on mobile / Safari
- [x] Launch project
- [x] Improve tooltips (style and content)
- [x] Save (and load) last position in the map
- [x] Improve bike lane style
- [x] Open the infowindows on click
- [x] Add about page
- [x] Add toggle to show/hide bike lanes
- [x] Show spinner while the user position is being fetched
- [x] Remove clustering
- [x] Add toggle to switch between modes (picking / leaving a bike)
- [x] Show bike lanes
- [x] Fix header for small screens
