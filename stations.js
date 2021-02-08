const fs = require('fs')
const Bicimad = require('bicimad')

Bicimad.get().then((result) => {
  let data = result.data

  data['updated_at'] = Date.now()

  let content = JSON.stringify(data)

  fs.writeFile('stations.json', content, 'utf8', (error) => {
    if (error) {
      return console.log(error)
    }
  })
})
