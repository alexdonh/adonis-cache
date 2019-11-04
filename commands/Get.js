'use strict'

const { Command } = require('@adonisjs/ace')
const Cache = use('Adonis/Addons/Cache')

class Get extends Command {
  static get signature () {
    return `
      cache:get
      { key: Cache key }
    `
  }

  static get description () {
    return 'Get a specified cache. Returns value or NULL if cache not found.'
  }

  async handle (args, options) {
    return Cache.get(args.key).then(value => {
      if (!value) {
        return this.info('Cache not found.')
      }
      this.info('Cache found:\n', value)
    })
  }
}

module.exports = Get
