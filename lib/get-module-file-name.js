import { readFileSync } from 'fs'
import { sep, dirname } from 'path'
import hashString from 'string-hash'
import getModuleName from './get-module-name.js'

function getEnd (minified) {
  return minified ? '.min.js' : '.js'
}

export function getPackageVersion (path) {
  const moduleName = getModuleName(path)
  let fullPath
  try {
    fullPath = require.resolve(`${moduleName}/package.json`, { paths: [ process.cwd() ] })
  } catch (e) {
    const packagePath = dirname(require.resolve(moduleName, { paths: [ process.cwd() ] }))
    fullPath = `${packagePath}/package.json`
  }
  return JSON.parse(readFileSync(fullPath, 'utf8')).version
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

export default getModuleFileName
