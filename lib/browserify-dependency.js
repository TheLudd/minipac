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
const isBundle = require('./is-bundle')
const getRequireString = require('./get-require-string')

function browserifyDependency (opts, includes) {
  const { allDependencies, distFolder, minifyDependencies } = opts
  const moduleFileName = getModuleFileName(minifyDependencies, includes)
  const modulePath = normalize(join(distFolder, 'js', moduleFileName))
  if (existsSync(modulePath)) {
    return
  }
  const allExternal = getExternal(allDependencies)
  const includeNames = includes.map(getModuleName)
  const external = allExternal.filter((e) => includeNames.indexOf(e) === -1)
  const mapFile = `${modulePath}.map`
  const timeString = `Browserified ${moduleFileName}`
  const writeStream = createWriteStream(modulePath)
  const b = browserify({ debug: true })
    .external(external)

  includes.forEach((item) => {
    b.require(getRequireString(item), { expose: getModuleName(item) })
  })
  const hasBundles = includes.some(isBundle)

  if (!hasBundles && minifyDependencies) {
    b
      .transform(envify({ NODE_ENV: 'production' }), { global: true })
      .transform(uglifyify, { global: true })
  }

  let timed = false
  b
    .bundle()
    .on('data', () => {
      if (!timed) {
        timed = true
        console.time(timeString)
      }
    })
    .on('error', (e) => console.log(e))
    .pipe(exorcist(mapFile))
    .pipe(writeStream)
  writeStream.on('finish', () => {
    console.timeEnd(timeString)
  })
}

module.exports = browserifyDependency
