'use strict'

const _ = require('lodash')
const Dependency = require('./Dependency')

class ChainedDependency extends Dependency {
  configure (config) {
    this.dependencies = []
    if (config.dependencies.length) {
      this.dependencies = _.map(config.dependencies, obj => {
        if (_.isPlainObject(obj)) {
          return Dependency.fromJSON(obj)
        }
        return obj
      })
    }
    this.dependOnAll = config.dependOnAll || true
    return super.configure(config)
  }

  async evaluateDependency (cache) {
    for (const dep of this.dependencies) {
      await dep.evaluateDependency(cache)
    }
  }

  async _generateDependencyData (cache) {
    return null
  }

  async isChanged (cache) {
    for (const dep of this.dependencies) {
      const isChanged = await dep.isChanged(cache)
      if (this.dependOnAll && isChanged) {
        return true
      } else if (!this.dependOnAll && !isChanged) {
        return false
      }
    }
    return !this.dependOnAll
  }
}

module.exports = ChainedDependency
