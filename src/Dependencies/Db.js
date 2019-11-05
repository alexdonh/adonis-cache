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
    this.Database.connection(this.connection)
    this.params = config.params || []
    this.sql = config.sql || ''
    return super.configure(config)
  }

  async _generateDependencyData (cache) {
    if (!this.sql) {
      throw RuntimeException.invoke('Sql must be set')
    }
    return this.Database.raw(this.sql, this.params).then(result => JSON.stringify(result.rows))
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
