'use strict'

const _ = require('lodash')
const crypto = require('crypto')
const { RuntimeException } = require('@adonisjs/generic-exceptions')
const { ioc } = require('@adonisjs/fold')

const sha1 = (str) => {
  return crypto.createHash('sha1').update(str).digest('hex')
}

class Dependency {
  constructor (config) {
    this.namespace = config.namespace || 'Adonis/Addons/Cache'
    this.data = config.data
    this.reusable = config.reusable || false
  }

  async evaluateDependency (cache) {
    if (this.reusable) {
      const hash = await this._generateReusableHash()
      if (!_.has(Dependency._reusableData, hash)) {
        Dependency._reusableData[hash] = await this._generateDependencyData(cache)
      }
      this.data = Dependency._reusableData[hash]
    } else {
      this.data = await this._generateDependencyData(cache)
    }
  }

  async isChanged (cache) {
    let data
    if (this.reusable) {
      const hash = await this._generateReusableHash()
      if (!_.has(Dependency._reusableData, hash)) {
        Dependency._reusableData[hash] = await this._generateDependencyData(cache)
      }
      data = Dependency._reusableData[hash]
    } else {
      data = await this._generateDependencyData(cache)
    }
    return data !== this.data
  }

  static resetReusableData () {
    Dependency._reusableData = {}
  }

  async _generateReusableHash () {
    const data = this.data
    this.data = null
    const key = sha1(JSON.stringify(this))
    this.data = data
    return key
  }

  async _generateDependencyData (cache) {
    throw RuntimeException.invoke('Not implemented')
  }

  toJSON () {
    this.__CLASS__ = [this.namespace, this.constructor.name].join('/')
    return Object.assign({}, this)
  }
}

Dependency._reusableData = {}

Dependency.fromJSON = (json) => {
  try {
    const obj = JSON.parse(json)
    if (!obj.__CLASS__) {
      return false
    }
    const Cls = ioc.make(obj.__CLASS__)
    return Object.create(Cls.prototype, Object.getOwnPropertyDescriptors(obj))
  } catch (err) {
    return false
  }
}

module.exports = Dependency
