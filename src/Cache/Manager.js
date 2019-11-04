'use strict'

const GE = require('@adonisjs/generic-exceptions')
const { ioc } = require('@adonisjs/fold')
const Stores = require('../Stores')

class CacheManager {
  constructor () {
    this._stores = {}
  }

  extend (name, implementation) {
    this._stores[name] = implementation
  }

  store (name) {
    const Store = this._stores[name] || Stores[name]
    if (!Store) {
      throw GE.InvalidArgumentException.invalidParameter(`${name} is not a valid cache store`)
    }
    return ioc.make(Store)
  }
}

module.exports = new CacheManager()
