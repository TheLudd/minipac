/* eslint-disable no-console */
const cluster = require('cluster')
const nbrCPUs = require('os').cpus().length
const {
  forEach,
  isEmpty,
  times,
} = require('ramda')
const { runJob } = require('./jobs')

function initJobs (jobSpecs) {
  function runMain () {
    let finishedJobs = 0
    const nbrJobs = jobSpecs.length
    const nbrForks = Math.min(nbrCPUs - 1, nbrJobs)
    const forks = times(() => cluster.fork(), nbrForks)
    console.log(`Initializing ${nbrForks} forks for ${jobSpecs.length} jobs`)
    console.time('Done. Total transpile time')
    const keepAliveMap = new WeakMap()

    function handleForkResponse (fork, response = {}) {
      const {
        forkInitialized = false,
        keepAlive = false,
      } = response
      if (keepAlive) {
        keepAliveMap.set(fork, keepAlive)
      }
      if (!isEmpty(jobSpecs)) {
        fork.send(jobSpecs.shift())
      } else if (keepAliveMap.get(fork) !== true) {
        fork.kill()
      }

      if (!forkInitialized) {
        finishedJobs += 1
        if (finishedJobs === nbrJobs) {
          console.timeEnd('Done. Total transpile time')
        }
      }
    }

    function initForks () {
      forEach((f) => {
        f.on('message', (r) => handleForkResponse(f, r))
      }, forks)
    }

    initForks()
  }

  function runFork () {
    process.on('message', (jobSpec) => {
      const { jobName, input } = jobSpec
      runJob(jobName, input)
    })
    process.send({ forkInitialized: true })
  }

  if (cluster.isMaster) {
    runMain()
  } else {
    runFork()
  }
}

module.exports = initJobs
