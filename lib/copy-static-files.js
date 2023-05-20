import {
  dirname,
  join,
} from 'path'
import fsExtra from 'fs-extra'

const { copy, ensureDir } = fsExtra

function copyStaticFiles (globalConf) {
  const { distFolder } = globalConf
  return Promise.all(globalConf.copy.map(({ from, to = '' }) => {
    const destination = join(distFolder, to)
    const destinationDir = destination.indexOf('.') === -1
      ? destination
      : dirname(destination)
    return ensureDir(destinationDir)
      .then(() => Promise.all(from.map((f) => copy(f, destination))))
  })).catch(console.log) // eslint-disable-line no-console
}

export default copyStaticFiles
