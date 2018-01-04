const { sep } = require('path')

function getSingleModuleName (path) {
  const parts = path.split(sep)
  const firstPart = parts[0]
  return firstPart.startsWith('@')
    ? parts.slice(0, 2).join(sep)
    : firstPart
}

function getModuleName (includes) {
  return typeof includes === 'string'
    ? getSingleModuleName(includes)
    : includes.map(getSingleModuleName).join('_')
}

module.exports = getModuleName
