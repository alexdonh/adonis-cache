'use strict'

const Dependency = require('./Dependency')

class DummyDependency extends Dependency {
  async generateDependencyData (cache) {
    return false
  }

  async isChanged (cache) {
    return true
  }
}

module.exports = DummyDependency
