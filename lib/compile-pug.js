/* eslint-disable no-console */
import { K } from 'yafu'
import { watchFile, writeFileSync } from 'fs'
import pug from 'pug'
import { normalize, join } from 'path'
import fsExtra from 'fs-extra'
import getModuleFileName from './get-module-file-name.js'

const { readFile } = fsExtra

function ensureArray (e) {
  return e instanceof Array ? e : [ e ]
}

function setLessDefaults (lessConf) {
  return Object.assign({}, { media: 'all' }, lessConf)
}

function compilePugTemplate (opts) {
  const {
    pugTemplate,
    pugLocals,
    externalDependencies,
    lessFiles,
    jsOutFile,
    minifyDependencies,
    htmlOutFile,
    distFolder,
  } = opts
  const timeString = `Compiled ${pugTemplate} -> ${htmlOutFile}`
  console.time(timeString)
  return readFile(pugTemplate, 'utf-8')
    .then((file) => {
      const fn = pug.compile(file, { pretty: !minifyDependencies })
      const externalIncludes = externalDependencies.map(ensureArray)
      const html = fn(Object.assign({}, {
        externalDependencies: externalIncludes.map((d) => getModuleFileName(minifyDependencies, d)),
        jsOutFile,
        lessFiles: lessFiles.map(setLessDefaults),
      }, pugLocals))
      const dest = normalize(join(distFolder, htmlOutFile))
      writeFileSync(dest, html)
      console.timeEnd(timeString)
    })
}

function compilePug (opts) {
  const { watch } = opts
  if (watch) {
    const { pugTemplate } = opts
    watchFile(pugTemplate, { interval: 300 }, () => {
      compilePugTemplate(opts)
    })
  }
  return compilePugTemplate(opts).then(K({ keepAlive: watch }))
}
export default compilePug
