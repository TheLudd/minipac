/* eslint-disable no-console */
const { join, normalize } = require('path')
const { writeFileSync } = require('fs')
const browserify = require('browserify')
const babelify = require('babelify')
const uglifyify = require('uglifyify')
const watchify = require('watchify')
const exorcist = require('exorcist')
const bl = require('bl')
const pluginAddModuleExports = require('babel-plugin-add-module-exports')
const babelRegister = require('@babel/register')
const presetEnv = require('@babel/preset-env')
const presetReact = require('@babel/preset-react')
const getExternal = require('./get-external')

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

  if (minifyJS) {
    b.transform(uglifyify, { global: true })
  }

  browserifyPlugins.forEach((conf) => {
    b.plugin(conf.name, conf.opts)
  })

  const bundleMainFile = () => {
    let timed = false
    const timeString = `Bundled ${jsEntryPoint} -> ${jsOutFile}`
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
      .pipe(bl((e, result) => {
        if (e != null) {
          console.log(e)
        } else {
          writeFileSync(targetPath, result)
          console.timeEnd(timeString)
        }
      }))
  }

  if (watch) {
    b.plugin(watchify)
    b.on('update', () => {
      bundleMainFile()
    })
  }
  bundleMainFile()
}

module.exports = bundle
