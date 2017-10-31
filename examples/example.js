'use strict'

require('make-promises-safe')
const h2url = require('..')
const getStream = require('get-stream')

const url = 'https://google.com'

async function concat () {
  const res = await h2url.concat({ url })
  console.log(res)
  // prints { headers, body }
}

concat()

async function streaming () {
  const res = await h2url.request({
    method: 'GET',
    headers: {
      // 'content-type': 'application/json'
    }// ,
    // body: JSON.stringify('something') // string, buffer or readable stream
  })

  console.log(res.headers)
  const body = getStream(res.stream)
  console.log(body)
}

streaming()
