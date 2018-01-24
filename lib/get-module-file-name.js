const { sep } = require('path')
const getModuleName = require('./get-module-name')
const hashString = require('string-hash')

function getEnd (minified) {
  return minified ? '.min.js' : '.js'
}

function getPackageVersion (path) {
  const moduleName = getModuleName(path)
  // eslint-disable-next-line
  return require(`${moduleName}/package.json`).version
}

function getSingleModuleFileName (path) {
  const version = getPackageVersion(path)
  const sanitized = path.replace(new RegExp(sep, 'g'), '-')
  return `${sanitized}-${version}`
}

function getMultipleModuleFileName (include) {
  const versions = include.map(getPackageVersion)
  const baseName = include.join('_').replace(new RegExp(sep, 'g'), '-')
  const hash = hashString(versions.join('-'))
  return `${baseName}-${hash}`
}

function getModuleFileName (minified, include) {
  const base = include.length === 1
    ? getSingleModuleFileName(minified, include[0])
    : getMultipleModuleFileName(minified, include)
  return `${base}${getEnd(minified)}`
}

module.exports = getModuleFileName
