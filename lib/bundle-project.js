/* eslint-disable no-console */
const {
  dirname,
  join,
  normalize,
  relative,
} = require('path')
const { copy, ensureDir } = require('fs-extra')
const bundle = require('./bundle')
const compilePug = require('./compile-pug')
const compileLess = require('./compile-less')
const browserifyDependency = require('./browserify-dependency')
const getModuleName = require('./get-module-name')

const relDirname = relative(process.cwd(), __dirname)
const defaultPugTemplate = normalize(join(relDirname, 'index.pug'))

const defaultScreen = {
  cssOutFile: 'style.css',
  decorateBrowserify: (b) => b,
  externalDependencies: [],
  htmlOutFile: 'index.html',
  jsEntryPoint: 'lib/index.jsx',
  jsOutFile: 'script.js',
  lessFile: 'lib/style.less',
  pugTemplate: defaultPugTemplate,
  watch: false,
}

const defaultGlobal = {
  copy: [],
  distFolder: 'dist',
}

const merge = (...args) => Object.assign({}, ...args)

function processExternalDependency (screen, ed) {
  const includes = ed instanceof Array ? ed : [ ed ]
  browserifyDependency(screen, includes)
}

function copyStaticFiles (globalConf) {
  const { distFolder } = globalConf
  return Promise.all(globalConf.copy.map(({ from, to = '' }) => {
    const destination = join(distFolder, to)
    const destinationDir = destination.indexOf('.') === -1
      ? destination
      : dirname(destination)
    return ensureDir(destinationDir)
      .then(() => Promise.all(from.map((f) => copy(f, destination))))
  })).catch(console.log)
}

function getUniqueDependencies (screens) {
  const set = new Set()
  return screens.reduce((acc, item) => {
    const { externalDependencies } = merge(defaultScreen, item)
    return acc.concat(externalDependencies.filter((dep) => {
      const key = dep instanceof Array
        ? dep.map(getModuleName).join('-')
        : getModuleName(dep)
      let include = false
      if (!set.has(key)) {
        include = true
        set.add(key)
      }
      return include
    }))
  }, [])
}

function addMinToFilename (original) {
  const index = original.indexOf('.js')
  return `${original.substring(0, index)}.min.js`
}

function bundleProject (screens, global) {
  const globalConf = merge(defaultGlobal, global)
  const { distFolder, minifyDependencies } = globalConf

  copyStaticFiles(globalConf)
    .then(() => (
      Promise.all([
        ensureDir(join(distFolder, 'js')),
        ensureDir(join(distFolder, 'css')),
      ])
    ))
    .then(() => {
      const allDependencies = getUniqueDependencies(screens)
      const depOpts = { allDependencies, distFolder, minifyDependencies }
      allDependencies.forEach((d) => processExternalDependency(depOpts, d))
      screens.forEach((s) => {
        const conf = merge(defaultScreen, globalConf, s)
        const { lessFiles, minifyJS } = conf
        const finalConf = minifyJS
          ? Object.assign({}, conf, { jsOutFile: addMinToFilename(conf.jsOutFile) })
          : conf
        bundle(finalConf)
        compilePug(finalConf)
        lessFiles.forEach((item) => {
          compileLess(finalConf, item)
        })
      })
    })
}

module.exports = bundleProject
