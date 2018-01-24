/* eslint-disable no-console */
const { join, normalize } = require('path')
const { createWriteStream, existsSync } = require('fs-extra')
const browserify = require('browserify')
const envify = require('envify/custom')
const uglifyify = require('uglifyify')
const exorcist = require('exorcist')
const getModuleName = require('./get-module-name')
const getModuleFileName = require('./get-module-file-name')
const getExternal = require('./get-external')

function browserifyDependency (opts, includes) {
  const { allDependencies, distFolder, minifyDependencies } = opts
  const moduleFileName = getModuleFileName(includes)
  const modulePath = normalize(join(distFolder, 'js', moduleFileName))
  if (existsSync(modulePath)) {
    return
  }
  const allExternal = getExternal(allDependencies)
  const external = allExternal.filter((e) => includes.indexOf(e) === -1)
  const mapFile = `${modulePath}.map`
  const timeString = `Browserified ${moduleFileName}`
  console.time(timeString)
  const writeStream = createWriteStream(modulePath)
  const b = browserify({ debug: true })
    .external(external)

  includes.forEach((item) => {
    b.require(item, { expose: getModuleName(item) })
  })

  if (minifyDependencies) {
    b
      .transform(envify({ NODE_ENV: 'production' }, { global: true }))
      .transform(uglifyify, { global: true })
  }

  b
    .bundle()
    .pipe(exorcist(mapFile))
    .pipe(writeStream)
  writeStream.on('finish', () => {
    console.timeEnd(timeString)
  })
}

module.exports = browserifyDependency
