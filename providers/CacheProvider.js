'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class CacheProvider extends ServiceProvider {
  register () {
    const namespace = 'Adonis/Addons/Cache'

    this.app.bind(`${namespace}/Dependencies/ChainedDependency`, () => {
      const Auth = require('../src/Dependencies/Chained')
      return Auth
    })
    this.app.alias(`${namespace}/Dependencies/ChainedDependency`, 'Cache/Dependencies/ChainedDependency')

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
