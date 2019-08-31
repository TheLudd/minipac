const { curry } = require('yafu')
const copyStaticFiles = require('./copy-static-files')
const browserifyDependency = require('./browserify-dependency')
const bundle = require('./bundle')
const compilePug = require('./compile-pug')
const compileLess = require('./compile-less')

const createJob = curry((jobName, input) => ({ input, jobName }))

const createCopyJob = createJob('copyStaticFiles')
const createExternalDependencyJob = createJob('browserifyDependency')
const createBundleJob = createJob('bundle')
const createLessJob = createJob('compileLess')
const createPugJob = createJob('compilePug')

const lookup = {
  browserifyDependency,
  bundle,
  compileLess,
  compilePug,
  copyStaticFiles,
}

const runJob = curry((jobName, input) => {
  const jobFn = lookup[jobName]
  jobFn(input)
    .then((response) => process.send(response))
    .catch((error) => process.send({ error, jobName }))
})

module.exports = {
  createBundleJob,
  createCopyJob,
  createExternalDependencyJob,
  createLessJob,
  createPugJob,
  runJob,
}
