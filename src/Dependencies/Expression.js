'use strict'

const safeeval = require('safe-eval')
const Dependency = require('./Dependency')

class ExpressionDependency extends Dependency {
  constructor (config) {
    super(config)
    this.expression = config.expression || 'true'
    this.params = config.params || {}
  }

  async _generateDependencyData (cache) {
    return safeeval(this.expression)
  }
}

module.exports = ExpressionDependency
