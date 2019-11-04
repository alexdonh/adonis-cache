'use strict'

const _ = require('lodash')
const Cache = require('./Cache')

class RedisCache extends Cache {
  static get inject () {
    return _.concat(Cache.inject, [
      'Adonis/Addons/Redis'
    ])
  }

  constructor (Logger, Redis) {
    super(Logger)
    this.Redis = Redis
  }

  configure (config) {
    this.connection = config.connection || 'local'
    this.Redis.connection(this.connection)
    super.configure(config)
  }

  async exists (key) {
    key = this.buildKey(key)
    return this._exists(key)
  }

  async _exists (key) {
    return this.Redis.exists(key)
  }

  async _getValue (key) {
    return this.Redis.get([key])
  }

  async _getValues (keys) {
    return this.Redis.mget(keys).then(result => {
      return _.zipObject(keys, result)
    })
  }

  async _setValue (key, value, duration) {
    return (duration === 0 ? this.Redis.set(key, value) : this.Redis.set(key, value, 'EX', duration)).then(result => result === 'OK')
  }

  async _setValues (items, duration) {
    const args = _.flatMap(items, (value, key) => {
      return [key, value]
    })
    if (duration === 0) {
      return this.Redis.mset(args).then(() => [])
    } else {
      const keys = _.keys(items)
      const pipeline = this.Redis.multi()
      pipeline.mset(args)
      for (const key of keys) {
        pipeline.expire(key, duration)
      }
      return pipeline.exec().then(res => {
        res.shift()
        return _.reduce(res, (result, value, index) => {
          if (value[1] !== 1) {
            result.push(keys[index])
          }
          return result
        }, [])
      })
    }
  }

  async _addValue (key, value, duration) {
    return (duration === 0 ? this.Redis.set(key, value, 'NX') : this.Redis.set(key, value, 'EX', duration, 'NX')).then(result => result === 'OK')
  }

  async _deleteValue (key) {
    return this.Redis.del([key]).then(result => !!result)
  }

  async _flushValues () {
    return this.Redis.flushdb().then(result => result === 'OK')
  }
}

module.exports = RedisCache
