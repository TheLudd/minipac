/* eslint-disable no-console */
import { K } from 'yafu'
import { watchFile, writeFileSync } from 'fs'
import { join, normalize } from 'path'
import less from 'less'
import fsExtra from 'fs-extra'
import NpmImportPlugin from 'less-plugin-npm-import'

const { readFile } = fsExtra

function compileLess ({ opts, lessConf }) {
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
    console.time(timeString)
    return readFile(entryPoint, 'utf-8')
      .then((file) => less.render(file, lessOptions))
      .then(({ css, imports, map }) => {
        writeFileSync(cssTarget, css)
        writeFileSync(mapTarget, map)
        console.timeEnd(timeString)
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

  return compileLessFile().then(K({ keepAlive: watch }))
}

export default compileLess
