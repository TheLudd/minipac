/* eslint-disable no-console */
import { join, normalize } from 'path'
import * as esbuild from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals'
import getExternal from './get-external.js'

function getOutFileForOpts (opts) {
  return normalize(join(opts.distFolder, 'js', opts.jsOutFile))
}

function getGlobals (opts) {
  return (opts.externalDependencies || []).reduce((acc, external) => {
    acc[external.name] = {
      varName: external.global,
      type: 'cjs',
    }
    return acc
  }, {})
}

async function bundle (opts) {
  const outFilePath = getOutFileForOpts(opts)

  const context = await esbuild.context({
    entryPoints: [ opts.jsEntryPoint ],
    bundle: true,
    outfile: outFilePath,
    sourcemap: true,
    minify: opts.minifyJS,
    external: getExternal(opts.externalDependencies),
    plugins: [
      polyfillNode({}),
      globalExternals(getGlobals(opts)),
    ],
  })

  const timeString = `Bundled ${opts.jsEntryPoint} -> ${opts.jsOutFile}`
  console.time(timeString)
  await context.rebuild()
  console.timeEnd(timeString)

  if (opts.watch) {
    await context.watch()
  }

  return { keepAlive: opts.watch }
}

export default bundle
