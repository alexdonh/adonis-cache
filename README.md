# Adonis Cache

Another cache provider for [AdonisJs](https://github.com/adonisjs/adonis-framework). Supports Object, File, Db and Redis data store. It also supports cache dependencies.

## Installation

```bash
$ adonis install git+https://github.com/alexdonh/adonis-cache.git --as=adonis-cache
```

Install optional dependencies to use. For example, install

```bash
$ npm i fs-extra microtime moment proper-lockfile
```

to use file store caching.

## Setup

1. Register cache providers in `start/app.js` file.

```js
const providers = [
  ...
  '@adonisjs/lucid/providers/LucidProvider',
  'adonis-cache/providers/CacheProvider'
]

const aceProviders = [
  ...
  '@adonisjs/lucid/providers/MigrationsProvider',
  'adonis-cache/providers/CommandsProvider'
]
```

4. Run the migrations if using db store cache. See [https://adonisjs.com/docs/4.1/migrations](https://adonisjs.com/docs/4.1/migrations)

```bash
$ adonis migration:run
```

## Usage

```js
const Cache = use('Adonis/Addons/Cache') // or alias: use('Cache')

// set cache
await Cache.set('key', 'This is a value', 60 * 60 * 24) // 24 hours

// get cache
await Cache.get('key')

// add cache, error if key exists
await Cache.add('key', something)

// check if cache exists
await Cache.exists('key')

// delete cache
await Cache.delete('key')

// flush all caches
await Cache.flush()

// use another cache store 'key', 'db', 'object', 'redis', or your own custom store
await Cache.store('file').get('key')

```

## Register a custom cache store

Updating...

## Credits

- [Alex Do](https://github.com/alexdonh)

## Support

Having trouble? [Open an issue](https://github.com/alexdonh/adonis-cache/issues/new)!

## License

The MIT License (MIT). See [License File](LICENSE) for more information.
