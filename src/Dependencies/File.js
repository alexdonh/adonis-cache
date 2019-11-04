'use strict'

const fs = require('fs-extra')
const { RuntimeException } = require('@adonisjs/generic-exceptions')
const Dependency = require('./Dependency')

class FileDependency extends Dependency {
  constructor (config) {
    super(config)
    this.fileName = config.fileName || false
  }

  async _generateDependencyData (cache) {
    if (!this.fileName) {
      throw RuntimeException.invoke('File name must be set')
    }
    return fs.stat(this.fileName)
      .then(stats => stats.mtime || false)
      .catch(() => false)
  }
}

module.exports = FileDependency
