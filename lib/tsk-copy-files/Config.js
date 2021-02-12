'use strict'

module.exports = class Config
{
    sourceDir
    whitelist
    blacklist
    dstPathFn
    overwrite

    constructor (opts)
    {
        for (const key in this)
        {
            if (!opts.hasOwnProperty(key))
            {
                throw `missing property in config: ${ key }`
            }
        }

        for (const key in opts)
        {
            if (!this.hasOwnProperty(key))
            {
                throw `unknown property in config: ${ key }`
            }

            this[key] = opts[key]
        }

        // sourceDir

        for (const prop of ['sourceDir'])
        {
            if (typeof this[prop] !== 'string')
            {
                throw `config.${ prop }: must be a string`
            }

            if (process.platform === 'win32') this[prop] = this[prop].replace(/\\/g, '/')
            this[prop] = this[prop].replace(/^\//, '').replace(/\/$/, '')
        }

        // whitelist/blacklist

        for (const prop of ['whitelist', 'blacklist'])
        {
            const list = this[prop]

            if (!(list instanceof Array))
            {
                throw `config.${ prop } must be an array of regular expressions`
            }

            for (const el of list)
            {
                if (!(el instanceof RegExp))
                {
                    throw `config.${ prop } must be an array of regular expressions`
                }
            }
        }

        // dstPathFn

        if (typeof this.dstPathFn !== 'function')
        {
            throw `config.dstPathFn must be a function`
        }

        // overwrite

        if (typeof this.overwrite !== 'boolean')
        {
            throw `config.overwrite must be a boolean`
        }
    }
}