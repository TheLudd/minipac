/* eslint-disable no-console */
const { watchFile, writeFileSync } = require('fs')
const pug = require('pug')
const { normalize, join } = require('path')
const getModuleFileName = require('./get-module-file-name')
const { readFile } = require('fs-extra')

function ensureArray (e) {
  return e instanceof Array ? e : [ e ]
}

function compilePugTemplate (opts) {
  const {
    pugTemplate,
    pugLocals,
    externalDependencies,
    cssOutFile,
    jsOutFile,
    htmlOutFile,
    distFolder,
  } = opts
  const timeString = `Compiled ${pugTemplate} -> ${htmlOutFile}`
  readFile(pugTemplate, 'utf-8')
    .then((file) => {
      console.time(timeString)
      const fn = pug.compile(file, { pretty: true })
      const externalIncludes = externalDependencies.map(ensureArray)
      const html = fn(Object.assign({}, {
        externalDependencies: externalIncludes.map(getModuleFileName),
        cssOutFile,
        jsOutFile,
      }, pugLocals))
      const dest = normalize(join(distFolder, htmlOutFile))
      return writeFileSync(dest, html)
    })
    .then(() => {
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
