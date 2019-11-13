'use strict'

const Cache = require('./Cache')

class DummyCache extends Cache {
  _getValue (key) {
    return false
  }

  _setValue (key, value, duration) {
    return true
  }

  _addValue (key, value, duration) {
    return true
  }

  _deleteValue (key) {
    return true
  }

  _flushValues () {
    return true
  }
}

module.exports = DummyCache
