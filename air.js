const fs = require('fs')
const Air = require('aire-madrid')

Air.getReadings().then((data) => {

  data['updated_at'] = Date.now()

  let content = JSON.stringify(data)

  fs.writeFile(`${ __dirname }/air.json`, content, 'utf8', (error) => {
    if (error) {
      return console.log(error)
    }
  })
})
