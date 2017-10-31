# h2url

Experimental http2 client for node and the CLI

## Usage as CLI

```
$ npx h2url https://localhost:3001
```

or

```
$ npm i -g h2url
$ h2url https://localhost:3001
```

### CLI options

```
Usage: h2url [options..] URL

Options:

  -X/--method METHOD      the http method to use
  -D/--data/--body BODY   the http body to send
  -v/--verbose            show the headers
  -h                      show this help
```

## Usage as a module

```
$ npm i h2url
```

```js
'use strict'

require('make-promises-safe')
const h2url = require('h2url')
const url = 'https://localhost:3001'
const getStream = require('get-stream')

async function concat () {
  const res = await h2url.concat({ url })
  console.log(res)
  // prints { headers, body }
}

concat()

async function streaming () {
  const res = await h2url.request({
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify('something') // string, buffer or readable stream
  })

  console.log(res.headers)
  const body = getStream(res.stream)
  console.log(body)
}

streaming()
```

## License

MIT
