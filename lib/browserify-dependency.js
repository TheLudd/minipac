/* eslint-disable no-console */
import { join, normalize } from 'path'
import { K, compose } from 'yafu'
import { any, test, map } from 'ramda'
import { PassThrough } from 'stream'
import multipipe from 'multipipe'
import bl from 'bl'
import fsExtra from 'fs-extra'
import browserify from 'browserify'
import watchify from 'watchify'
import envify from 'envify/custom.js'
import minifyStream from 'minify-stream'
import exorcist from 'exorcist'
import getModuleName from './get-module-name.js'
import getModuleFileName from './get-module-file-name.js'
import getExternal from './get-external.js'
import isBundle from './is-bundle.js'
import getRequireString from './get-require-string.js'
import writeStreamToPromise from './write-stream-to-promise.js'

const { existsSync, writeFileSync } = fsExtra

function createModulePath (name) {
  return require.resolve(name, { paths: [ process.cwd() ] })
}

function isLinked (path) {
  return !test(/node_modules/, path)
}

function browserifyDependency ({ includes, opts }) {
  const {
    allDependencies,
    distFolder,
    minifyDependencies,
    watch: watchOverride,
  } = opts
  const moduleFileName = getModuleFileName(minifyDependencies, includes)
  const modulePath = normalize(join(distFolder, 'js', moduleFileName))

  const modules = Array.isArray(includes)
    ? includes
    : [ includes ]
  const watch = watchOverride
    && any(isLinked, map(compose(createModulePath, getModuleName), modules))
  if (existsSync(modulePath) && !watch) {
    return Promise.resolve('')
  }
  const allExternal = getExternal(allDependencies)
  const includeNames = includes.map(getModuleName)
  const external = allExternal.filter((e) => includeNames.indexOf(e) === -1)
  const mapFile = `${modulePath}.map`
  const timeString = `Browserified ${moduleFileName}`
  const standalone = includes.length === 1
    ? includes[0].global
    : ''
  const b = browserify({ debug: true, standalone })
    .external(external)

  includes.forEach((item) => {
    b.require(getRequireString(item), { expose: getModuleName(item) })
  })
  const hasBundles = includes.some(isBundle)
  const minify = !hasBundles && minifyDependencies
  function createMinifier () {
    return minify ? minifyStream() : new PassThrough()
  }

  if (minify) {
    b
      .transform(envify({ NODE_ENV: 'production' }), { global: true })
  }

  function bundleMainFile () {
    console.time(timeString)
    return multipipe(
      b.bundle(),
      createMinifier(),
      exorcist(mapFile),
      bl((e, result) => {
        if (e != null) {
          console.log(e)
        } else {
          writeFileSync(modulePath, result)
          console.timeEnd(timeString)
        }
      }),
    )
  }

  if (watch) {
    b.plugin(watchify)
    b.on('update', bundleMainFile)
  }

  return writeStreamToPromise(bundleMainFile()).then(K({ keepAlive: watch }))
    .catch(console.log)
}

export default browserifyDependency
