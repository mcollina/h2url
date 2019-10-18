'use strict'

const http2 = require('http2')
const { URL } = require('url')
const assert = require('assert')
const getStream = require('get-stream')
const pump = require('pump')
const eos = require('end-of-stream')

async function request (opts) {
  assert.equal(typeof opts, 'object')

  const url = new URL(opts.url)

  const client = http2.connect(url.origin, {
    rejectUnauthorized: false
  })

  const req = Object.assign({
    ':path': `${url.pathname}${url.search}`,
    ':method': opts.method || 'GET'
  }, opts.headers)

  const stream = client.request(req)

  end(stream, opts.body)

  // Needed because of https://github.com/nodejs/node/issues/16617
  // I would use unref() instead and let the user destroy the client
  eos(stream, () => {
    client.destroy()
  })

  const headers = await waitForHeaders(stream)

  return { headers, stream }
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
