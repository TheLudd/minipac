/* eslint-disable no-console */
const { watchFile, writeFileSync } = require('fs')
const { join, normalize } = require('path')
const less = require('less')
const { readFile } = require('fs-extra')
const NpmImportPlugin = require('less-plugin-npm-import')

function compileLess (opts) {
  const {
    cssOutFile,
    distFolder,
    lessFile,
    watch,
  } = opts
  const watchedFiles = new Set()
  const cssTarget = normalize(join(distFolder, 'css', cssOutFile))
  const mapName = `${cssOutFile}.map`
  const mapTarget = normalize(join(distFolder, 'css', mapName))
  const lessOptions = {
    filename: lessFile,
    sourceMap: {
      sourceMapURL: mapName,
      outputSourceFiles: true,
    },
    plugins: [ new NpmImportPlugin({ prefix: '~' }) ],
  }

  function compileLessFile () {
    console.time(`Compiled ${lessFile}`)
    return readFile(lessFile, 'utf-8')
      .then((file) => less.render(file, lessOptions))
      .then(({ css, imports, map }) => {
        writeFileSync(cssTarget, css)
        writeFileSync(mapTarget, map)
        console.timeEnd(`Compiled ${lessFile}`)
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
    registerWatcher(lessFile)
  }

  compileLessFile()
}

module.exports = compileLess
