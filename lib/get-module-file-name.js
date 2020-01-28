const { sep } = require('path')
const hashString = require('string-hash')
const getModuleName = require('./get-module-name')

function getEnd (minified) {
  return minified ? '.min.js' : '.js'
}

function getPackageVersion (path) {
  const moduleName = getModuleName(path)
  const fullPath = require.resolve(`${moduleName}/package.json`, { paths: [ process.cwd() ] })
  // eslint-disable-next-line
  return require(fullPath).version
}

function getSingleModuleFileName (path) {
  const version = getPackageVersion(path)
  const sanitized = getModuleName(path).replace(new RegExp(sep, 'g'), '-')
  return `${sanitized}-${version}`
}

function getMultipleModuleFileName (include) {
  const versions = include.map(getPackageVersion)
  const baseName = include.map(getModuleName).join('_').replace(new RegExp(sep, 'g'), '-')
  const hash = hashString(versions.join('-'))
  return `${baseName}-${hash}`
}

function getModuleFileName (minified, include) {
  const base = include.length === 1
    ? getSingleModuleFileName(include[0])
    : getMultipleModuleFileName(include)
  return `${base}${getEnd(minified)}`
}

module.exports = getModuleFileName
