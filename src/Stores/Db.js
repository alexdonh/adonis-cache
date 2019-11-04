'use strict'

const _ = require('lodash')
const moment = require('moment')
const Cache = require('./Cache')
const IntegerHelper = require('../Helpers/Integer')

class DbCache extends Cache {
  static get inject () {
    return _.concat(Cache.inject, [
      'Adonis/Src/Database'
    ])
  }

  constructor (Logger, Database) {
    super(Logger)
    this.Database = Database
  }

  configure (config) {
    this.connection = config.connection || 'sqlite'
    this.cacheTable = config.cacheTable || 'cache'
    this.gcProbability = config.gcProbability || 100
    this.Database.connection(this.connection)
    super.configure(config)
  }

  async exists (key) {
    key = this.buildKey(key)
    return this._exists(key)
  }

  async close () {
    return this.Database.close(this.connection)
  }

  async _exists (key) {
    return await this.Database
      .table(this.cacheTable)
      .where('id', key)
      .where(function () {
        this
          .where('expiredAt', null)
          .orWhere('expiredAt', '>', moment().utc())
      })
      .getCount() > 0
  }

  async _getValue (key) {
    const row = await this.Database
      .table(this.cacheTable)
      .where('id', key)
      .where(function () {
        this
          .where('expiredAt', null)
          .orWhere('expiredAt', '>', moment().utc())
      })
      .first()
    if (row) {
      return row.data
    }
    return false
  }

  async _getValues (keys) {
    if (_.isEmpty(keys)) {
      return {}
    }
    let rows = await this.Database
      .table(this.cacheTable)
      .whereIn('id', keys)
      .where(function () {
        this
          .where('expiredAt', null)
          .orWhere('expiredAt', '>', moment().utc())
      })
      .fetch()

    rows = _.keyBy(rows, 'id')
    return _.reduce(keys, (result, key) => {
      result[key] = rows[key].data || false
    }, {})
  }

  async _setValue (key, value, duration) {
    await this.gc()
    try {
      const now = duration > 0 ? moment().add(duration, 'seconds').utc() : null
      if (await this._exists(key)) {
        return !!await this.Database
          .table(this.cacheTable)
          .where('id', key)
          .update({ data: value, expiredAt: now })
      } else {
        return !!await this.Database
          .table(this.cacheTable)
          .insert({ id: key, data: value, expiredAt: now })
      }
    } catch (err) {
      this.Logger.debug(`Unable to update cache: ${this.cacheTable}\n`, err)
      return false
    }
  }

  async _addValue (key, value, duration) {
    await this.gc()
    try {
      const now = duration > 0 ? moment().add(duration, 'seconds').utc() : null
      return !!await this.Database
        .table(this.cacheTable)
        .insert({ id: key, data: value, expiredAt: now })
    } catch (err) {
      this.Logger.debug(`Unable to insert cache: ${this.cacheTable}\n`, err)
      return false
    }
  }

  async _deleteValue (key) {
    return !!await this.Database
      .table(this.cacheTable)
      .where('id', key)
      .delete()
  }

  async _flushValues () {
    await this.Database
      .table(this.cacheTable)
      .delete()
    return true
  }

  async gc (force = false) {
    if (force || IntegerHelper.mtrand(0, 1000000) < this.gcProbability) {
      await this.Database
        .table(this.cacheTable)
        .where('expiredAt', '>', 0)
        .where('expiredAt', '<', moment().utc())
        .delete()
    }
  }
}

module.exports = DbCache
