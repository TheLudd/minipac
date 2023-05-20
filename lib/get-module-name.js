import { sep } from 'path'

function getSingleModuleName (entry) {
  const path = typeof entry === 'string' ? entry : entry.name
  const parts = path.split(sep)
  const firstPart = parts[0]
  return firstPart.startsWith('@')
    ? parts.slice(0, 2).join(sep)
    : firstPart
}

function getModuleName (includes) {
  return includes instanceof Array
    ? includes.map(getSingleModuleName).join('_')
    : getSingleModuleName(includes)
}

export default getModuleName
