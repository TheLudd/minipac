/* eslint-disable no-console */
const { join, normalize } = require('path')
const { writeFileSync } = require('fs')
const browserify = require('browserify')
const babelify = require('babelify')
const watchify = require('watchify')
const exorcist = require('exorcist')
const bl = require('bl')
const getExternal = require('./get-external')

const browserifyDefaultOpts = {
  debug: true,
  extensions: [ '.js', '.jsx', '.json' ],
}

function bundle (opts) {
  const {
    decorateBrowserify,
    externalDependencies,
    jsEntryPoint,
    jsOutFile,
    distFolder,
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
    .transform(babelify, { global: true, presets: [ '@babel/preset-env', '@babel/preset-react' ] })

  decorateBrowserify(b)

  const bundleMainFile = () => {
    const timeString = `Bundled ${jsEntryPoint} -> ${jsOutFile}`
    console.time(timeString)
    b.bundle()
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
