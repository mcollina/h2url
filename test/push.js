'use strict'

const { test } = require('tap')
const http2 = require('http2')
const Store = require('abstract-blob-store')
const h2url = require('..')
const { promisify } = require('util')
const pump = require('pump')
const getStream = require('get-stream')

test('receive server push', async (t) => {
  const server = http2.createServer()

  server.on('stream', (stream) => {
    t.ok(stream.pushAllowed, 'push is allowed')
    stream.pushStream({ ':path': '/file.js' }, (pushStream) => {
      console.log('sending push')
      pushStream.respond({ ':status': 200 })
      pushStream.end('console.log(\'hello\')')
    })
    stream.respond({ ':status': 200 })
    stream.end('hello world')
  })

  const listen = promisify(server.listen.bind(server))

  await listen(0)
  server.unref()

  const url = `http://localhost:${server.address().port}`
  const store = new Store()

  const res = await h2url.concat({
    url,
    store
  })

  t.equal(res.body, 'hello world')
  t.equal(res.headers[':status'], 200)

  const exists = promisify(store.exists.bind(store))
  const hasFile = await exists('/file.js')

  t.ok(hasFile)

  const data = await getStream(store.createReadStream('/file.js'))
  t.equal(data.toString(), 'console.log(\'hello\')')
})
