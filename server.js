'use strict'

const fs = require('fs')
const path = require('path')
const http2 = require('http2')

const server = http2.createServer()
server.on('stream', handle)

const secureServer = http2.createSecureServer({
  key: fs.readFileSync(path.join(__dirname, 'test', 'test.key')),
  cert: fs.readFileSync(path.join(__dirname, 'test', 'test.cert'))
})
secureServer.on('stream', handle)

server.listen(3000, () => {
  console.log('HTTP server listening on 3000')
})

secureServer.listen(3001, () => {
  console.log('HTTPS server listening on 3001')
})

function handle (stream, headers) {
  console.log('> got request', headers)

  const msg = JSON.stringify({ hello: 'world' })
  setTimeout(function () {
    console.log('< sending reply')
    stream.respond({
      ':status': 200,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(msg)
    })
    stream.end(msg)
  }, 2000)
}
