'use strict'

module.exports = class Config
{
    sourceDir
    whitelist
    blacklist
    outputFile
    header

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

        // sourceDir / outputFile

        for (const prop of ['sourceDir', 'outputFile'])
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

        // header

        if (this.header && typeof this.header !== 'function')
        {
            throw `config.header: must be a function or undefined`
        }
    }
}