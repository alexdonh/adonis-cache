'use strict'

const Cache = require('./Cache')

class DummyCache extends Cache {
  async _getValue (key) {
    return false
  }

  async _setValue (key, value, duration) {
    return true
  }

  async _addValue (key, value, duration) {
    return true
  }

  async _deleteValue (key) {
    return true
  }

  async _flushValues () {
    return true
  }
}

module.exports = DummyCache
