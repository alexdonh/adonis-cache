'use strict'

const crypto = require('crypto')

module.exports = {
  md5 (str) {
    return crypto.createHash('md5').update(str).digest('hex')
  },
  alnum (str) {
    let code, i, len, isAlpha, isNumeric
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i)
      switch (true) {
        case code > 47 && code < 58:
          isNumeric = true
          break
        case (code > 64 && code < 91) || (code > 96 && code < 123):
          isAlpha = true
          break
        default:
          return false
      }
    }
    return isAlpha || isNumeric
  },
  byteLength (str) {
    return Buffer.byteLength(str)
  }
}
