import express from 'express'
import { join } from 'path'
import { createReadStream } from 'fs'
import cookieParser from 'cookie-parser'

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

  app.get(/.*.map/, (_, res, next) => {
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

  app.get(/\./, express.static(baseDir, {
    fallthrough: false,
  }))

  app.get(/.*/, (req, res) => {
    res.header('Content-Type', 'text/html')
    getRootPath(req, res)
      .then((file) => {
        createReadStream(join(baseDir, file))
          .on('error', (e) => res.status(500).end(e))
          .pipe(res)
      })
  })

  function startApp () {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, (e) => {
        if (e != null) {
          reject(e)
        } else {
          resolve(server)
        }
      })
    })
  }

  return startApp()
    .then((server) => {
      if (livereload) {
        // eslint-disable-next-line global-require
        const lr = require('livereload')
        const lrserver = lr.createServer()
        lrserver.watch(baseDir)
      }
      return server
    })
}

export { startServer }
