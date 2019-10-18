'use strict'

const { test } = require('tap')
const fs = require('fs')
const path = require('path')
const http2 = require('http2')
const h2url = require('..')
const {
  Readable,
  Writable
} = require('stream')
const getStream = require('get-stream')

test('https', (t) => {
  const server = http2.createSecureServer({
    key: fs.readFileSync(path.join(__dirname, 'test.key')),
    cert: fs.readFileSync(path.join(__dirname, 'test.cert'))
  })

  server.listen(0, () => {
    server.unref()

    doTests(server, 'https', t.test)
    t.end()
  })
})

test('http', (t) => {
  const server = http2.createServer()

  server.listen(0, () => {
    server.unref()

    doTests(server, 'http', t.test)
    t.end()
  })
})

function doTests (server, scheme, test) {
  const url = `${scheme}://localhost:${server.address().port}`

  test('concat request', async (t) => {
    server.once('stream', (stream, headers) => {
      t.equal(headers[':method'], 'GET')
      stream.respond({ ':status': 200 })
      stream.end('hello world')
    })

    const res = await h2url.concat({ url })

    t.equal(res.body, 'hello world')
    t.equal(res.headers[':status'], 200)
  })
  
  test('query parameters', async (t) => {
    server.once('stream', (stream, headers) => {
      t.equal(headers[':method'], 'GET')
      t.equal(headers[':path'], '/hello?foo=bar')
      stream.respond({ ':status': 200 })
      stream.end('hello world')
    })

    const res = await h2url.concat({ url: `${url}/hello?foo=bar` })

    t.equal(res.body, 'hello world')
    t.equal(res.headers[':status'], 200)
  })

  test('concat post', async (t) => {
    server.once('stream', async (stream, headers) => {
      t.equal(headers[':method'], 'POST')

      const body = await getStream(stream)

      t.equal(body, 'this is a post!')

      stream.respond({ ':status': 200 })
      stream.end('hello world')
    })

    const res = await h2url.concat({
      url,
      method: 'POST',
      body: 'this is a post!'
    })

    t.equal(res.body, 'hello world')
    t.equal(res.headers[':status'], 200)
  })

  test('concat post with stream', async (t) => {
    server.once('stream', async (stream, headers) => {
      t.equal(headers[':method'], 'POST')

      const body = await getStream(stream)

      t.equal(body, 'this is a post!')

      stream.respond({ ':status': 200 })
      stream.end('hello world')
    })

    const res = await h2url.concat({
      url,
      method: 'POST',
      body: new Readable({
        read () {
          this.push('this is a post!')
          this.push(null)
        }
      })
    })

    t.equal(res.body, 'hello world')
    t.equal(res.headers[':status'], 200)
  })

  test('request', async (t) => {
    server.once('stream', (stream, headers) => {
      t.equal(headers[':method'], 'GET')
      stream.respond({ ':status': 200 })
      stream.end('hello world')
    })

    const res = await h2url.request({ url })

    t.ok(res.stream instanceof Writable)
    t.equal(res.headers[':status'], 200)

    const body = await getStream(res.stream)

    t.equal(body, 'hello world')
  })

  test('concat request receiving headers', async (t) => {
    server.once('stream', (stream, headers) => {
      t.equal(headers[':method'], 'GET')
      stream.respond({ ':status': 200, 'content-type': 'application/json' })
      stream.end(JSON.stringify({ hello: 'world' }))
    })

    const res = await h2url.concat({ url })

    t.deepEqual(JSON.parse(res.body), { hello: 'world' })
    t.equal(res.headers[':status'], 200)
    t.equal(res.headers['content-type'], 'application/json')
  })

  test('concat post', async (t) => {
    server.once('stream', async (stream, headers) => {
      t.equal(headers[':method'], 'POST')
      t.equal(headers['content-type'], 'application/json')

      const body = await getStream(stream)

      t.deepEqual(JSON.parse(body), { hello: 'world' })

      stream.respond({ ':status': 200 })
      stream.end('hello world')
    })

    const res = await h2url.concat({
      url,
      method: 'POST',
      body: JSON.stringify({ hello: 'world' }),
      headers: {
        'content-type': 'application/json'
      }
    })

    t.equal(res.body, 'hello world')
    t.equal(res.headers[':status'], 200)
  })
}
