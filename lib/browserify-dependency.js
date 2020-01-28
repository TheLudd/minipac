/* eslint-disable no-console */
const { dirname, join, normalize } = require('path')
const { K, compose } = require('yafu')
const { any, map } = require('ramda')
const bl = require('bl')
const { existsSync, lstatSync, writeFileSync } = require('fs-extra')
const browserify = require('browserify')
const watchify = require('watchify')
const envify = require('envify/custom')
const uglifyify = require('uglifyify')
const exorcist = require('exorcist')
const getModuleName = require('./get-module-name')
const getModuleFileName = require('./get-module-file-name')
const getExternal = require('./get-external')
const isBundle = require('./is-bundle')
const getRequireString = require('./get-require-string')
const writeStreamToPromise = require('./write-stream-to-promise')

function createModulePath (name) {
  return require.resolve(name, { paths: [ process.cwd() ] })
}

function isSybmolicLink (path) {
  if (path === '/') return false

  const stat = lstatSync(path)
  return stat.isSymbolicLink() || isSybmolicLink(dirname(path))
}

function browserifyDependency ({ includes, opts }) {
  const {
    allDependencies,
    distFolder,
    minifyDependencies,
  } = opts
  const moduleFileName = getModuleFileName(minifyDependencies, includes)
  const modulePath = normalize(join(distFolder, 'js', moduleFileName))

  const modules = Array.isArray(includes)
    ? includes
    : [ includes ]
  const watch = any(isSybmolicLink, map(compose(createModulePath, getModuleName), modules))
  if (existsSync(modulePath) && !watch) {
    return Promise.resolve('')
  }
  const allExternal = getExternal(allDependencies)
  const includeNames = includes.map(getModuleName)
  const external = allExternal.filter((e) => includeNames.indexOf(e) === -1)
  const mapFile = `${modulePath}.map`
  const timeString = `Browserified ${moduleFileName}`
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

  function bundleMainFile () {
    console.time(timeString)
    return b
      .bundle()
      .on('error', (e) => console.log(e))
      .pipe(exorcist(mapFile))
      .pipe(bl((e, result) => {
        if (e != null) {
          console.log(e)
        } else {
          writeFileSync(modulePath, result)
          console.timeEnd(timeString)
        }
      }))
  }

  if (watch) {
    b.plugin(watchify)
    b.on('update', bundleMainFile)
  }

  return writeStreamToPromise(bundleMainFile()).then(K({ keepAlive: watch }))
}

module.exports = browserifyDependency
