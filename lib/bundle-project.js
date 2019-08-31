/* eslint-disable no-console */
const {
  join,
  normalize,
  relative,
} = require('path')
const { ensureDir } = require('fs-extra')
const { curry } = require('yafu')
const { chain, map } = require('ramda')
const getModuleName = require('./get-module-name')
const runJobs = require('./run-job')
const {
  createCopyJob,
  createBundleJob,
  createExternalDependencyJob,
  createLessJob,
  createPugJob,
} = require('./jobs')

const relDirname = relative(process.cwd(), __dirname)
const defaultPugTemplate = normalize(join(relDirname, 'index.pug'))

const defaultScreen = {
  browserifyPlugins: [],
  cssOutFile: 'style.css',
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

const processExternalDependency = curry((screen, ed) => {
  const includes = ed instanceof Array ? ed : [ ed ]
  return createExternalDependencyJob({ includes, opts: screen })
})

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

  Promise.all([
    ensureDir(join(distFolder, 'js')),
    ensureDir(join(distFolder, 'css')),
  ])
    .then(() => {
      const copyJob = createCopyJob(globalConf)

      const jobs = [ copyJob ]
      const allDependencies = getUniqueDependencies(screens)
      const depOpts = { allDependencies, distFolder, minifyDependencies }
      const externalDependencyJobs = map(processExternalDependency(depOpts), allDependencies)
      const screenJobs = chain((s) => {
        const conf = merge(defaultScreen, globalConf, s)
        const { lessFiles, minifyJS } = conf
        const opts = minifyJS
          ? Object.assign({}, conf, { jsOutFile: addMinToFilename(conf.jsOutFile) })
          : conf
        const lessJobs = map((lessConf) => createLessJob({ lessConf, opts }), lessFiles)
        return [
          createBundleJob(opts),
          createPugJob(opts),
          ...lessJobs,
        ]
      }, screens)
      runJobs(screenJobs.concat(jobs, externalDependencyJobs))
    })
}

module.exports = bundleProject
