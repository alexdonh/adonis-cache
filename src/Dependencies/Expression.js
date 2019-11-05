'use strict'

const safeeval = require('safe-eval')
const Dependency = require('./Dependency')

class ExpressionDependency extends Dependency {
  configure (config) {
    this.expression = config.expression || 'true'
    this.params = config.params || {}
    return super.configure(config)
  }

  async _generateDependencyData (cache) {
    return safeeval(this.expression)
  }
}

module.exports = ExpressionDependency
