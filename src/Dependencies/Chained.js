'use strict'

const Dependency = require('./Dependency')

class ChainedDependency extends Dependency {
  configure (config) {
    this.dependencies = config.dependencies || []
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
