/* eslint-disable no-console */
const { relative, normalize, join } = require('path')
const { copy, ensureDir } = require('fs-extra')
const bundle = require('./bundle')
const compilePug = require('./compile-pug')
const compileLess = require('./compile-less')
const browserifyDependency = require('./browserify-dependency')

const relDirname = relative(process.cwd(), __dirname)
const defaultPugTemplate = normalize(join(relDirname, 'index.pug'))

const defaultScreen = {
  decorateBrowserify: (b) => b,
  externalDependencies: [],
  jsEntryPoint: 'lib/index.jsx',
  htmlOutFile: 'index.html',
  jsOutFile: 'script.js',
  lessFile: 'lib/style.less',
  cssOutFile: 'style.css',
  pugTemplate: defaultPugTemplate,
  watch: false,
}

const defaultGlobal = {
  copy: [],
  distFolder: 'dist',
}

const merge = (d, s) => Object.assign({}, d, s)

function processExternalDependency (screen, ed) {
  const includes = typeof ed === 'string' ? [ ed ] : ed
  browserifyDependency(screen, includes)
}

function copyStaticFiles (globalConf) {
  const { distFolder } = globalConf
  return Promise.all(globalConf.copy.map(({ from, to = '' }) => {
    const destination = join(distFolder, to)
    return ensureDir(destination)
      .then(() => Promise.all(from.map((f) => copy(f, destination))))
  })).catch(console.log)
}

function getUniqueDependencies (screens) {
  const set = new Set()
  return screens.reduce((acc, item) => {
    const { externalDependencies } = merge(defaultScreen, item)
    return acc.concat(externalDependencies.filter((dep) => {
      const key = typeof dep === 'string' ? dep : dep.join('-')
      let include = false
      if (!set.has(key)) {
        include = true
        set.add(key)
      }
      return include
    }))
  }, [])
}

function bundleProject (screens, global) {
  const globalConf = merge(defaultGlobal, global)
  const { distFolder } = globalConf

  copyStaticFiles(globalConf)
    .then(() => (
      Promise.all([
        ensureDir(join(distFolder, 'js')),
        ensureDir(join(distFolder, 'css')),
      ])
    ))
    .then(() => {
      const allDependencies = getUniqueDependencies(screens)
      const depOpts = { allDependencies, distFolder }
      allDependencies.forEach((d) => processExternalDependency(depOpts, d))
      screens.forEach((s) => {
        const conf = merge(defaultScreen, s)
        bundle(conf)
        compilePug(conf)
        compileLess(conf)
      })
    })
}

module.exports = bundleProject
