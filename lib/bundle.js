/* eslint-disable no-console */
const { K } = require('yafu')
const { join, normalize } = require('path')
const { writeFileSync } = require('fs')
const { PassThrough } = require('stream')
const browserify = require('browserify')
const babelify = require('babelify')
const minifyStream = require('minify-stream')
const watchify = require('watchify')
const exorcist = require('exorcist')
const bl = require('bl')
const multipipe = require('multipipe')
const pluginAddModuleExports = require('babel-plugin-add-module-exports')
const babelRegister = require('@babel/register')
const presetEnv = require('@babel/preset-env')
const presetReact = require('@babel/preset-react')
const getExternal = require('./get-external')
const writeStreamToPromise = require('./write-stream-to-promise')

const babelOpts = {
  babelrc: false,
  plugins: [ pluginAddModuleExports ],
  presets: [ presetEnv.default, presetReact.default ],
  sourceMaps: true,
}
babelRegister(babelOpts)

const browserifyDefaultOpts = {
  debug: true,
  extensions: [ '.js', '.jsx', '.json' ],
}

function bundle (opts) {
  const {
    browserifyPlugins,
    distFolder,
    externalDependencies,
    jsEntryPoint,
    jsOutFile,
    minifyJS,
    watch,
  } = opts

  const targetPath = normalize(join(distFolder, 'js', jsOutFile))
  const mapFile = `${targetPath}.map`
  const browserifyExtraOpts = watch
    ? { cache: {}, packageCache: {} }
    : {}

  const browserifyOpts = Object.assign({}, browserifyDefaultOpts, browserifyExtraOpts)

  const external = getExternal(externalDependencies)
  const b = browserify(jsEntryPoint, browserifyOpts)
    .external(external)
    .plugin(pluginAddModuleExports)
    .transform(babelify, { global: true, presets: [ presetEnv, presetReact ] })

  function createMinifier () {
    return minifyJS ? minifyStream() : new PassThrough()
  }

  browserifyPlugins.forEach((conf) => {
    b.plugin(conf.name, conf.opts)
  })

  const bundleMainFile = () => {
    const timeString = `Bundled ${jsEntryPoint} -> ${jsOutFile}`
    console.time(timeString)
    return multipipe(
      b.bundle(),
      createMinifier(),
      exorcist(mapFile),
      bl((e, result) => {
        if (e != null) {
          console.log('Should really not be here')
          console.log(e)
        } else {
          writeFileSync(targetPath, result)
          console.timeEnd(timeString)
        }
      }),
    )
  }

  if (watch) {
    b.plugin(watchify)
    b.on('update', () => {
      bundleMainFile()
    })
  }
  return writeStreamToPromise(bundleMainFile()).then(K({ keepAlive: watch }))
    .catch(console.log)
}

module.exports = bundle
