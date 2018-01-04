const { sep } = require('path')
const getModuleName = require('./get-module-name')
const hashString = require('string-hash')

function getPackageVersion (path) {
  const moduleName = getModuleName(path)
  // eslint-disable-next-line
  return require(`${moduleName}/package.json`).version
}

function getSingleModuleFileName (path) {
  const version = getPackageVersion(path)
  const sanitized = path.replace(new RegExp(sep, 'g'), '-')
  return `${sanitized}-${version}.js`
}

function getMultipleModuleFileName (include) {
  const versions = include.map(getPackageVersion)
  const baseName = include.join('_').replace(new RegExp(sep, 'g'), '-')
  const hash = hashString(versions.join('-'))
  return `${baseName}-${hash}.js`
}

function getModuleFileName (include) {
  return include.length === 1
    ? getSingleModuleFileName(include[0])
    : getMultipleModuleFileName(include)
}

module.exports = getModuleFileName
