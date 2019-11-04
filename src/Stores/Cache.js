'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const { InvalidArgumentException, RuntimeException } = require('@adonisjs/generic-exceptions')
// const Dependency = require('../Dependencies/Dependency')
const StringHelper = require('../Helpers/String')

class Cache {
  static get inject () {
    return [
      'Adonis/Src/Logger'
    ]
  }

  configure (config) {
    this.keyPrefix = config.keyPrefix || ''
    if (!config.serializer) {
      this.serializer = config.serializer !== false ? [JSON.stringify, JSON.parse] : false
    } else if (_.isArray(config.serializer) && config.serializer.length === 2 && _.every(config.serializer, (e) => e instanceof Function)) {
      this.serializer = config.serializer
    } else {
      throw InvalidArgumentException.invalidParameter('Serializer must be an array with 2 elements: The first element specifies the serialization function and the second the deserialization function.')
    }

    this.defaultDuration = config.defaultDuration || 0
  }

  constructor (Logger) {
    this.Logger = Logger
  }

  buildKey (key) {
    if (_.isString(key)) {
      key = StringHelper.alnum(key) && StringHelper.byteLength(key) <= 32 ? key : StringHelper.md5(key)
    } else {
      const serializedKey = this.serializer ? this.serializer[0].call(null, key) : JSON.stringify(key)
      key = StringHelper.md5(serializedKey)
    }
    return [this.keyPrefix, key].join('')
  }

  async exists (key) {
    key = this.buildKey(key)
    const value = await this._getValue(key)
    return value !== false
  }

  async get (key) {
    key = this.buildKey(key)
    let value = await this._getValue(key)
    if (value === false || this.serializer === false) {
      return value
    }
    value = this.serializer[1].call(null, value)
    if (_.isArray(value) && value.length === 2) {
      const [data, dependency] = value
      if (!(dependency && dependency.isChanged && await dependency.isChanged(this))) {
        return data
      }
    }
    return false
  }

  async multiGet (keys) {
    keys = _.map(keys, key => this.buildKey(key))
    const values = await this._getValues(keys)
    return _.mapValues(values, async value => {
      if (value === false || this.serializer === false) {
        return value
      }
      value = this.serializer[1].call(null, value)
      if (_.isArray(value) && value.length === 2) {
        const [data, dependency] = value
        if (!(dependency && dependency.isChanged && await dependency.isChanged(this))) {
          return data
        }
      }
      return false
    })
  }

  async set (key, value, duration = undefined, dependency = undefined) {
    if (typeof duration === 'undefined' || duration == null) {
      duration = this.defaultDuration
    }
    if (dependency && this.serializer !== false) {
      dependency.evaluateDependency(this)
    }
    if (this.serializer !== false) {
      value = this.serializer[0].call(null, [value, dependency && dependency.toJSON ? dependency.toJSON() : false])
    }
    key = this.buildKey(key)
    return this._setValue(key, value, duration)
  }

  async multiSet (items, duration = undefined, dependency = undefined) {
    if (typeof duration === 'undefined' || duration == null) {
      duration = this.defaultDuration
    }
    if (dependency && this.serializer !== false) {
      dependency.evaluateDependency(this)
    }
    const values = _.reduce(items, (result, value, key) => {
      if (this.serializer !== false) {
        value = this.serializer[0].call(null, [value, dependency && dependency.toJSON ? dependency.toJSON() : false])
      }
      key = this.buildKey(key)
      result[key] = value
      return result
    }, {})
    return this._setValues(values, duration)
  }

  async add (key, value, duration = undefined, dependency = undefined) {
    if (typeof duration === 'undefined' || duration == null) {
      duration = this.defaultDuration
    }
    if (dependency && this.serializer !== false) {
      dependency.evaluateDependency(this)
    }
    if (this.serializer !== false) {
      value = this.serializer[0].call(null, [value, dependency && dependency.toJSON ? dependency.toJSON() : false])
    }
    key = this.buildKey(key)
    return this._addValue(key, value, duration)
  }

  async multiAdd (items, duration = undefined, dependency = undefined) {
    if (typeof duration === 'undefined' || duration == null) {
      duration = this.defaultDuration
    }
    if (dependency && this.serializer !== false) {
      dependency.evaluateDependency(this)
    }
    const values = _.reduce(items, (result, value, key) => {
      if (this.serializer !== false) {
        value = this.serializer[0].call(null, [value, dependency && dependency.toJSON ? dependency.toJSON() : false])
      }
      key = this.buildKey(key)
      result[key] = value
      return result
    }, {})
    return this._addValues(values, duration)
  }

  async delete (key) {
    key = this.buildKey(key)
    return this._deleteValue(key)
  }

  async flush () {
    return this._flushValues()
  }

  async getOrSet (key, closure, duration = undefined, dependency = undefined) {
    if (typeof duration === 'undefined' || duration == null) {
      duration = this.defaultDuration
    }
    let value = await this.get(key)
    if (value !== false) {
      return value
    }
    value = await closure.call(this)
    if (!await this.set(key, value, duration, dependency)) {
      this.Logger.warning(`Failed to set value for key ${JSON.stringify(key)}`)
    }
    return value
  }

  async _getValue (key) {
    throw RuntimeException.invoke('Not implemented')
  }

  async _setValue (key, value, duration) {
    throw RuntimeException.invoke('Not implemented')
  }

  async _addValue (key, value, duration) {
    throw RuntimeException.invoke('Not implemented')
  }

  async _deleteValue (key) {
    throw RuntimeException.invoke('Not implemented')
  }

  async _flushValues () {
    throw RuntimeException.invoke('Not implemented')
  }

  async _getValues (keys) {
    return Promise.mapSeries(keys, key => this._getValue(key)).then(values => {
      return _.zipObject(keys, values)
    })
  }

  async _setValues (items, duration) {
    return Promise.mapSeries(_.keys(items), key => this._setValue(key, items[key], duration).then(result => result === false ? key : true)).then(result => _.filter(result, r => r !== true))
  }

  async _addValues (items, duration) {
    return Promise.mapSeries(_.keys(items), key => this._addValue(key, items[key], duration).then(result => result === false ? key : true)).then(result => _.filter(result, r => r !== true))
  }
}

module.exports = Cache
