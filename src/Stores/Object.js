'use strict'

const _ = require('lodash')
const microtime = require('microtime')
const Cache = require('./Cache')

class ObjectCache extends Cache {
  constructor (Logger, config) {
    super(Logger, config)
    this._cache = {}
  }

  async _exists (key) {
    return _.has(this._cache, key) && (this._cache[key][1] === 0 || this._cache[key][1] > microtime.nowDouble())
  }

  async exists (key) {
    key = this.buildKey(key)
    return this._exists(key)
  }

  async _getValue (key) {
    if (await this._exists(key)) {
      return this._cache[key][0]
    }
    return false
  }

  async _setValue (key, value, duration) {
    this._cache[key] = [value, duration === 0 ? 0 : microtime.nowDouble() + duration]
    return true
  }

  async _addValue (key, value, duration) {
    if (await this._exists(key)) {
      return false
    }
    this._cache[key] = [value, duration === 0 ? 0 : microtime.nowDouble() + duration]
    return true
  }

  async _deleteValue (key) {
    delete this._cache[key]
    return true
  }

  async _flushValues () {
    this._cache = {}
    return true
  }
}

module.exports = ObjectCache
