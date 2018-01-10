const express = require('express')
const { join } = require('path')
const { createReadStream } = require('fs')
const cookieParser = require('cookie-parser')

function startServer (inputOpts) {
  const opts = Object.assign({ customRoutes: [] }, inputOpts)
  const {
    allowSourceMaps,
    customRoutes,
    baseDir,
    getRootPath,
    livereload,
    port,
  } = opts

  const app = express()
  app.use(cookieParser())

  customRoutes.forEach(({ method, route, handler }) => {
    app[method](route, handler)
  })

  app.get(/.*.map/, (req, res, next) => {
    if (allowSourceMaps) {
      next()
    } else {
      res.status(404).end()
    }
  })

  if (livereload) {
    // eslint-disable-next-line global-require
    app.use(require('connect-livereload')({
      port: 35729,
    }))
  }

  app.use(express.static(baseDir))

  app.get(/.*/, (req, res) => {
    res.header('Content-Type', 'text/html')
    getRootPath(req)
      .then((file) => {
        createReadStream(join(baseDir, file))
          .on('error', (e) => res.status(500).end(e))
          .pipe(res)
      })
  })

  function startApp () {
    return new Promise((resolve, reject) => {
      app.listen(port, (e, res) => {
        if (e != null) {
          reject(e)
        } else {
          resolve(res)
        }
      })
    })
  }

  return startApp()
    .then(() => {
      if (livereload) {
        // eslint-disable-next-line global-require
        const lr = require('livereload')
        const lrserver = lr.createServer()
        lrserver.watch(baseDir)
      }
    })
}

module.exports = { startServer }
