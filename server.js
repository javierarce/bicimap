require('dotenv').config()

const fs = require('fs')
const path = require('path')
const express = require('express')
const cmd = require('node-cmd')
const bodyParser = require('body-parser')
const session = require('express-session')
const helmet = require('helmet')

const config = require('./config')

const app = express()

const multer = require('multer')
const multipart = multer()

const sassMiddleware = require('node-sass-middleware')

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const webpackConfig = require('./webpack.config.js')

app.use(sassMiddleware({
  src: path.join(__dirname, 'src/assets/scss'),
  dest: '/public',
  sourceMap: true,
  force: true,
  outputStyle: 'compressed'
}))

const devServerEnabled = true

if (devServerEnabled) {
  //reload=true:Enable auto reloading when changing JS files or content
  //timeout=1000:Time from disconnecting from server to reconnecting
  webpackConfig.entry.app.unshift('webpack-hot-middleware/client?reload=true&timeout=1000')

  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())

  const compiler = webpack(webpackConfig)

  app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath
  }))

  app.use(webpackHotMiddleware(compiler))
}

app.use(express.static('public'))
app.use(bodyParser.json())
app.use(helmet())
 
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/leaflet', express.static(__dirname + '/node_modules/leaflet/dist'))
app.use('/leaflet.markercluster', express.static(__dirname + '/node_modules/leaflet.markercluster/dist'))

app.get('/api/stations', (request, response) => { 
  console.log('stations');
  fs.readFile('stations.json', 'utf8', (error, data) => {
    if (error) {
      console.log(error);
      throw error;
    }
    response.json(JSON.parse(data))
  })
})

app.get('/', function(request, response) {
  response.sendfile(__dirname + '/public/index.html')
})

const listener = app.listen(process.env.PORT, function() {
  console.log('your app is listening on port ' + listener.address().port)
})
