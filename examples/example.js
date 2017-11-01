'use strict'

require('make-promises-safe')
const h2url = require('..')

const url = 'https://google.com'

async function concat () {
  const res = await h2url.concat({ url })
  console.log(res)
  // prints { headers, body }
}

concat()
