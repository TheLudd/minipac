/* eslint-disable no-console */
import { K } from 'yafu'
import { join, normalize } from 'path'
import { writeFileSync } from 'fs'
import { PassThrough } from 'stream'
import browserify from 'browserify'
import babelify from 'babelify'
import minifyStream from 'minify-stream'
import watchify from 'watchify'
import exorcist from 'exorcist'
import bl from 'bl'
import multipipe from 'multipipe'
import pluginAddModuleExports from 'babel-plugin-add-module-exports'
import babelRegister from '@babel/register'
import presetEnv from '@babel/preset-env'
import presetReact from '@babel/preset-react'
import getExternal from './get-external.js'
import writeStreamToPromise from './write-stream-to-promise.js'

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

export default bundle
