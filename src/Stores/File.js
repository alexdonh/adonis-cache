'use strict'

const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const lockfile = require('proper-lockfile')
const moment = require('moment')
const Cache = require('./Cache')
const IntegerHelper = require('../Helpers/Integer')

class FileCache extends Cache {
  static get inject () {
    return _.concat(Cache.inject, [
      'Adonis/Src/Helpers'
    ])
  }

  constructor (Logger, Helpers) {
    super(Logger)
    this.Helpers = Helpers
  }

  configure (config) {
    this.cachePath = config.cachePath || path.join(this.Helpers.tmpPath(), 'cache')
    this.cacheFileSuffix = config.cacheFileSuffix || '.bin'
    this.directoryLevel = config.directoryLevel || 1
    this.gcProbability = config.gcProbability || 10
    this.fileMode = config.fileMode || 0o644
    this.dirMode = config.dirMode || 0o755
    fs.ensureDirSync(this.cachePath, this.dirMode)
    super.configure(config)
  }

  _getCacheFile (key) {
    let base = this.cachePath
    if (this.directoryLevel > 0) {
      for (let i = 0; i < this.directoryLevel; ++i) {
        const prefix = key.substr(i + i, 2)
        if (prefix) {
          base = path.join(base, prefix)
        }
      }
    }
    return path.join(base, [key, this.cacheFileSuffix].join(''))
  }

  async exists (key) {
    key = this.buildKey(key)
    const cacheFile = this._getCacheFile(key)
    return fs.stat(cacheFile)
      .then(stats => {
        return moment(stats.mtime).isAfter()
      })
      .catch(() => false)
  }

  async _getValue (key) {
    const cacheFile = this._getCacheFile(key)
    return fs.stat(cacheFile)
      .then(stats => {
        if (moment(stats.mtime).isAfter()) {
          return lockfile.lock(cacheFile).then(release => {
            return fs.readFile(cacheFile, 'utf8').then(data => {
              return release().then(() => data)
            })
          })
        }
        return false
      })
      .catch(() => false)
  }

  async _setValue (key, value, duration) {
    await this.gc()
    const cacheFile = this._getCacheFile(key)
    if (this.directoryLevel > 0) {
      await fs.ensureDir(path.dirname(cacheFile), { mode: this.dirMode })
    }

    const write = (release) => fs.writeFile(cacheFile, value, { encoding: 'utf8', mode: this.fileMode })
      .then(() => {
        if (duration <= 0) {
          duration = 31536000 // 1 year
        }
        return fs.utimes(cacheFile, moment().toDate(), moment().add(duration, 'seconds').toDate()).then(() => {
          return release().then(() => true)
        })
      })
      .catch(err => {
        this.Logger.error(`Unable to write cache file: ${cacheFile}\n`, err)
        return false
      })

    return fs.stat(cacheFile)
      .then(stats => {
        if (stats.isFile()) {
          if (process.geteuid && process.geteuid() !== stats.uid) {
            return fs.unlink(cacheFile).then(() => write(Promise.resolve.bind(Promise)))
          } else {
            return lockfile.lock(cacheFile)
              .then(release => write(release))
              .catch(err => {
                this.Logger.error(`Cache file is locked: ${cacheFile}\n`, err)
                return false
              })
          }
        }
        return Promise.reject(new Error('File error'))
      })
      .catch(err => {
        if (err && err.code === 'ENOENT') { // file not exists
          return write(Promise.resolve.bind(Promise))
        }
        this.Logger.error(`Unable to write cache file: ${cacheFile}\n`, err)
        return false
      })
  }

  async _addValue (key, value, duration) {
    const cacheFile = this._getCacheFile(key)
    return fs.stat(cacheFile)
      .then(stats => {
        if (moment(stats.mtime).isAfter()) {
          return false
        }
        return this._setValue(key, value, duration)
      })
      .catch(err => {
        if (err && err.code === 'ENOENT') {
          return this._setValue(key, value, duration)
        }
        return false
      })
  }

  async _deleteValue (key) {
    const cacheFile = this._getCacheFile(key)
    return fs.unlink(cacheFile).then(() => true).catch(() => false)
  }

  async _flushValues () {
    await this.gc(true, false)
    return true
  }

  async gc (force = false, expiredOnly = true) {
    if (force || IntegerHelper.mtrand(0, 1000000) < this.gcProbability) {
      await this._gcRecursive(this.cachePath, expiredOnly)
    }
  }

  async _gcRecursive (filePath, expiredOnly) {
    try {
      const files = await fs.readdir(filePath, { encoding: 'utf8' })
      for (let i = 0; i < files.length; ++i) {
        try {
          const subPath = path.join(filePath, files[i])
          const stats = await fs.stat(subPath)
          if (stats.isDirectory()) {
            await this._gcRecursive(subPath, expiredOnly)
            if (!expiredOnly) {
              await fs.rmdir(subPath).catch(() => { })
            }
          } else if (!expiredOnly || (expiredOnly && moment(stats.mdate).isSameOrBefore())) {
            await fs.unlink(subPath).catch(() => { })
          }
        } catch (err) {
          continue
        }
      }
    } catch (err) {

    }
  }
}

module.exports = FileCache
