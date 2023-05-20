import { curry } from 'yafu'
import copyStaticFiles from './copy-static-files.js'
import browserifyDependency from './browserify-dependency.js'
import bundle from './bundle.js'
import compilePug from './compile-pug.js'
import compileLess from './compile-less.js'

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

export {
  createBundleJob,
  createCopyJob,
  createExternalDependencyJob,
  createLessJob,
  createPugJob,
  runJob,
}
