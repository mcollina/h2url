'use strict'

const { to } = require('await-to-ts')
const { ifError } = require('assert')
const getStream = require('get-stream')

const h2url = require('.')

const url = 'https://www.google.com'

async function concat () {
  const res = await h2url.concat({ url })
  console.log(res)
  // prints { headers, body }
}

concat().catch(console.error.bind(console))

async function streaming () {
  const [err, res] = await to(h2url.request({
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify('something') // string, buffer or readable stream
  }))

  ifError(err)
  console.log(res.headers)
  const body = getStream(res.stream)
  console.log(body)
}

streaming().catch(console.error.bind(console))
