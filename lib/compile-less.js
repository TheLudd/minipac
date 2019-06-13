/* eslint-disable no-console */
const { watchFile, writeFileSync } = require('fs')
const { join, normalize } = require('path')
const less = require('less')
const { readFile } = require('fs-extra')
const NpmImportPlugin = require('less-plugin-npm-import')

function compileLess (opts, lessConf) {
  const { distFolder, watch } = opts
  const { target, entryPoint } = lessConf
  const watchedFiles = new Set()
  const cssTarget = normalize(join(distFolder, 'css', target))
  const mapName = `${target}.map`
  const mapTarget = normalize(join(distFolder, 'css', mapName))
  const lessOptions = {
    filename: entryPoint,
    plugins: [ new NpmImportPlugin({ prefix: '~' }) ],
    sourceMap: {
      outputSourceFiles: true,
      sourceMapURL: mapName,
    },
  }

  function compileLessFile () {
    const timeString = `Compiled ${entryPoint} -> ${cssTarget}`
    return readFile(entryPoint, 'utf-8')
      .then((file) => {
        console.time(timeString)
        return less.render(file, lessOptions)
      })
      .then(({ css, imports, map }) => {
        console.timeEnd(timeString)
        writeFileSync(cssTarget, css)
        writeFileSync(mapTarget, map)
        if (watch) {
          imports.forEach((f) => {
            if (!watchedFiles.has(f)) {
              // eslint-disable-next-line no-use-before-define
              registerWatcher(f)
            }
          })
        }
      })
      .catch(console.log)
  }

  function registerWatcher (f) {
    watchedFiles.add(f)
    watchFile(f, { interval: 300 }, compileLessFile)
  }

  if (watch) {
    registerWatcher(entryPoint)
  }

  compileLessFile()
}

module.exports = compileLess
