/* eslint-disable no-console */
const { watchFile, writeFileSync } = require('fs')
const pug = require('pug')
const { normalize, join } = require('path')
const { readFile } = require('fs-extra')
const getModuleFileName = require('./get-module-file-name')

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
  readFile(pugTemplate, 'utf-8')
    .then((file) => {
      console.time(timeString)
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
    .catch((e) => {
      console.log('Pug error')
      console.log(e)
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
  compilePugTemplate(opts)
}
module.exports = compilePug
