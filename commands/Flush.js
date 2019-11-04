'use strict'

const { Command } = require('@adonisjs/ace')
const Cache = use('Adonis/Addons/Cache')

class Flush extends Command {
  static get signature () {
    return 'cache:flush'
  }

  static get description () {
    return 'Flush all caches'
  }

  async handle (args, options) {
    return Cache.flush().then(() => {
      this.info('All caches flushed.')
    })
  }
}

module.exports = Flush
