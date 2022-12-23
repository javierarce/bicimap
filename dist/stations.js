const fs = require('fs')
const Bicimad = require('bicimad')
const Bicing = require('bicing')

Bicimad.get().then((result) => {
  let data = result.data

  data['updated_at'] = Date.now()

  let content = JSON.stringify(data)

  fs.writeFile(`${ __dirname }/madrid.json`, content, 'utf8', (error) => {
    if (error) {
      return console.log(error)
    }
  })
})

Bicing.get().then((result) => {
  let data = result

  data['updated_at'] = Date.now()

  let content = JSON.stringify(data)

  fs.writeFile(`${ __dirname }/barcelona.json`, content, 'utf8', (error) => {
    if (error) {
      return console.log(error)
    }
  })
})
