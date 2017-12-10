'use strict'

const http2 = require('http2')
const { URL } = require('url')
const assert = require('assert')
const getStream = require('get-stream')
const pump = require('pump')
const { promisify } = require('util')
const eos = require('end-of-stream')
const eosP = promisify(eos)

async function request (opts) {
  assert.equal(typeof opts, 'object')

  const url = new URL(opts.url)
  const { store } = opts

  const client = http2.connect(url.origin, {
    rejectUnauthorized: false
  })

  const req = Object.assign({
    ':path': url.pathname,
    ':method': opts.method || 'GET'
  }, opts.headers)

  const stream = client.request(req)

  const streams = new Set()
  const wait = []

  client.on('stream', (pushStream, requestHeaders) => {
    console.log('push received', requestHeaders[':path'])
    streams.add(pushStream)
    const dest = store.createWriteStream(requestHeaders[':path'])
    pump(pushStream, dest)
    wait.push(eosP(pushStream))
  })

  stream.on('end', function () {
    console.log('emitting end')
  })

  ed(stream, opts.body)

  const headers = await waitForHeaders(stream)

  await Promise.all(wait)
  console.log('all push streams received')

  // Needed because of https://github.com/nodejs/node/issues/16617
  // I would use unref() instead and let the user destroy the client
  eos(stream, done)

  return { headers, stream }

  function done () {
    console.log('cleaning client')
    client.destroy()
  }
}

async function concat (opts) {
  const res = await request(opts)
  const headers = res.headers
  const body = await getStream(res.stream)

  return { body, headers }
}

function waitForHeaders (req) {
  return new Promise(function (resolve, reject) {
    req.on('response', resolve)
  })
}

function end (req, body) {
  if (!body || typeof body === 'string' || body instanceof Uint8Array) {
    req.end(body)
  } else if (body.pipe) {
    pump(body, req)
  } else {
    throw new Error(`type unsupported for body: ${body.constructor}`)
  }
}

module.exports = {
  request,
  concat
}
