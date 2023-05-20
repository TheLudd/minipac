import getModuleName from './get-module-name.js'

function chain (fn, list) {
  const out = []
  list.forEach((e) => {
    const innerList = fn(e)
    innerList.forEach((i) => out.push(i))
  })
  return out
}

function getExternal (dependency) {
  return dependency instanceof Array
    ? dependency.map(getModuleName)
    : [ getModuleName(dependency) ]
}

export default (dependencies) => chain(getExternal, dependencies)
