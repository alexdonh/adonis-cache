'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class CommandsProvider extends ServiceProvider {
  register () {
    this.app.bind('App/Commands/Rbac:Get', () => require('../commands/Get'))
    this.app.bind('App/Commands/Rbac:Flush', () => require('../commands/Flush'))
  }

  boot () {
    const ace = require('@adonisjs/ace')
    ace.addCommand('App/Commands/Rbac:Get')
    ace.addCommand('App/Commands/Rbac:Flush')
  }
}

module.exports = CommandsProvider
