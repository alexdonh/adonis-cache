'use strict'

const { RuntimeException } = require('@adonisjs/generic-exceptions')
const Dependency = require('./Dependency')

class DbDependency extends Dependency {
  static get inject () {
    return [
      'Adonis/Src/Database'
    ]
  }

  constructor (Database) {
    super()
    this.Database = Database
  }

  configure (config) {
    this.connection = config.connection || 'sqlite'
    this.query = config.query || false
    this.Database.connection(this.connection)
    return super.configure(config)
  }

  async _generateDependencyData (cache) {
    if (!this.query) {
      throw RuntimeException.invoke('Query function must be set')
    }
    return this.query.call(null, this.Database)
  }

  toJSON () {
    const db = this.Database
    delete this.Database
    const json = super.toJSON()
    this.Database = db
    return json
  }
}

module.exports = DbDependency
