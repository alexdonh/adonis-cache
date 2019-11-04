'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class CacheProvider extends ServiceProvider {
  register () {
    const namespace = 'Adonis/Addons/Cache'
    const builtInDependencies = ['Chained', 'Db', 'Dummy', 'Expression', 'File', 'Tag']

    for (const dep of builtInDependencies) {
      this.app.bind(`${namespace}/${dep}Dependency`, () => {
        return require(`../src/Dependencies/${dep}`)
      })
      this.app.alias(`${namespace}/${dep}Dependency`, `Cache/${dep}Dependency`)
    }

    this.app.singleton(`${namespace}`, app => {
      const Cache = require('../src/Cache')
      const Config = this.app.use('Adonis/Src/Config')
      const Logger = this.app.use('Adonis/Src/Logger')
      return new Cache(Logger, Config.get('cache', {}))
    })
    this.app.manager(`${namespace}`, require('../src/Cache/Manager'))
    this.app.alias(`${namespace}`, 'Cache')
  }
}

module.exports = CacheProvider
