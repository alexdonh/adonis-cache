'use strict'

const _ = require('lodash')
const microtime = require('microtime')
const Dependency = require('./Dependency')

class TagDependency extends Dependency {
  configure (config) {
    this.tags = config.tags || []
    return super.configure(config)
  }

  async generateDependencyData (cache) {
    let timestamps = await this._getTimestamps(cache, this.tags)
    const keys = _.reduce(timestamps, (keys, ts, key) => {
      if (ts === false) { keys.push(key) }
      return keys
    }, [])
    if (!_.isEmpty(keys)) {
      const ts = await TagDependency._touchKeys(cache, keys)
      timestamps = _.extend(timestamps, ts)
    }
    return timestamps
  }

  async isChanged (cache) {
    const timestamps = await this._getTimestamps(cache, this.tags)
    return !_.isEqual(timestamps, this.data)
  }

  async _getTimestamps (cache, tags) {
    if (_.isEmpty(tags)) {
      return {}
    }
    if (_.isString(tags)) {
      tags = [tags]
    }
    const keys = _.map(tags, tag => cache.buildKey([TagDependency.name, tag]))
    return cache.multiGet(keys)
  }

  static async _touchKeys (cache, keys) {
    const time = microtime.now()
    const items = _.reduce(keys, (obj, key) => {
      obj[key] = time
      return obj
    }, {})
    return cache.multiSet(items)
  }

  static async invalidate (cache, tags) {
    if (_.isString(tags)) {
      tags = [tags]
    }
    const keys = _.map(tags, tag => cache.buildKey([TagDependency.name, tag]))
    return TagDependency._touchKeys(cache, keys)
  }
}

module.exports = TagDependency
