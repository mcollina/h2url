#! /usr/bin/env node --no-warnings

require('make-promises-safe')

const { URL } = require('url')
const minimist = require('minimist')
const h2url = require('.')
const fs = require('fs')
const path = require('path')
const pump = require('pump')
const ora = require('ora')
const chalk = require('chalk')
const tinysonic = require('tinysonic')

async function start () {
  const args = minimist(process.argv.slice(1), {
    boolean: ['verbose', 'help'],
    string: ['headers'],
    alias: {
      h: 'help',
      method: 'X',
      body: ['data', 'D'],
      v: 'verbose',
      headers: 'H'
    },
    default: {
      method: 'GET'
    }
  })

  args.url = args._[1]

  if (args.help) {
    pump(
      fs.createReadStream(path.join(__dirname, 'help.txt')),
      process.stdout
    )
    return
  }

  if (args.headers) {
    args.headers = tinysonic(args.headers)
  }

  if (args.verbose) {
    printHeaders(fakeHeaders(args), '>')
  }

  const spinner = ora(`${chalk.bold(args.method)} ${args.url}`).start()

  const res = await h2url.request(args)

  spinner.stop()

  if (args.verbose) {
    printHeaders(res.headers, '<')
  }

  pump(res.stream, process.stdout)
}

function fakeHeaders (opts) {
  const url = new URL(opts.url)

  return Object.assign({
    ':scheme': url.protocol.slice(0, url.protocol.length - 1),
    ':authority': url.hostname + ':' + url.port,
    ':method': opts.method,
    ':path': url.pathname
  }, opts.headers)
}

function printHeaders (headers, prefix) {
  for (const key in headers) {
    console.log(`${prefix} ${chalk.bold(key)} = ${headers[key]}`)
  }
}

setImmediate(start)
