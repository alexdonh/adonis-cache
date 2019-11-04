'use strict'

const { InvalidArgumentException, RuntimeException } = require('@adonisjs/generic-exceptions')
const Manager = require('./Manager')

class Cache {
  constructor (Logger, config) {
    this.config = config
    this._stores = {}
    return new Proxy(this, {
      get (target, name) {
        if (target[name] !== undefined) {
          return target[name]
        }
        const store = target.store()
        if (typeof store[name] === 'function') {
          return store[name].bind(store)
        }
        return store[name]
      }
    })
  }

  store (name) {
    name = name || this.config.default
    if (!name) {
      throw InvalidArgumentException.missingConfig('cache.default', 'config/cache.js')
    }
    name = name.toLowerCase()
    if (!this._stores[name]) {
      const store = Manager.store(name)
      const config = this.config[name]
      if (!config) {
        throw RuntimeException.missingConfig(`cache.${name}`, 'config/cache.js')
      }
      store.configure(config)
      this._stores[name] = store
    }
    return this._stores[name]
  }
}

module.exports = Cache
