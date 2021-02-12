'use strict' // 2021-02-05 08.33

const fs = require('fs')
const http = require('http')
const path = require('path')
const util = require('util')
const mimes = require('./lib/mimes')
const dirview = require('./lib/dirview')

class Config
{
    dir = ''
    port = 1234
    rewrites = []
    redirects = []
    autoindex = true
    servedir = false
    headers = { 'cache-control': `public, max-age=604800, immutable` }
    mimes = {}
    logfile = ''
    verbosity = 'normal'

    constructor (config = {})
    {
        if (!(config instanceof Object) || config instanceof Array)
        {
            throw new Error(`config is not an object:\n${ util.inspect(config) }`)
        }

        // bulk runtime typecheck and merger of partials with defaults

        for (const key in config)
        {
            if (!this.hasOwnProperty(key))
            {
                throw new Error(`unrecognized option: ${ key }`)
            }

            if (typeof config[key] !== typeof this[key])
            {
                throw new Error(`config.${ key } type error: expected a ${ typeof this[key] }, got ${ typeof config[key] }`)
            }

            this[key] = config[key]
        }

        // dir

        if (process.platform === 'win32') this.dir = this.dir.replace(/\\/g, '/')
        if (this.dir !== '/') this.dir = this.dir.replace(/\/$/, '')

        if (!fs.existsSync(this.dir))
        {
            throw `config.dir directory doesn't exist: ${ this.dir }`
        }

        if (!fs.statSync(this.dir).isDirectory())
        {
            throw `config.dir is not a directory: ${ this.dir }`
        }

        // port

        if (!Number.isInteger(this.port) || this.port < 1 || this.port > 65535)
        {
            throw new Error(`invalid port specified: ${ this.port }`)
        }

        // rewrites / redirects

        for (const key of ['rewrites', 'redirects'])
        {
            if (!(this[key] instanceof Array))
            {
                throw new Error(`config.${ key } must be an array`)
            }

            for (const el of this[key])
            {
                if (typeof el !== 'function')
                {
                    throw new Error(`config.${ key } must be an array of functions`)
                }
            }
        }

        // autoindex

        if (typeof this.autoindex !== 'boolean')
        {
            throw `config.autoindex must be a boolean`
        }

        if (this.autoindex && this.servedir)
        {
            throw new Error(`config.autoindex and config.servedir are mutally exclusive`)
        }

        // servedir

        if (typeof this.servedir !== 'boolean')
        {
            throw `config.servedir must be a boolean`
        }

        // headers

        if (!this.headers || Array.isArray(this.headers))
        {
            throw new Error(`'headers' opts must be an object`)
        }

        // mimes

        if (!(this.mimes instanceof Object) || this.mimes instanceof Array)
        {
            throw new Error(`config mimes is not an object:\n${ util.inspect(this.mimes) }`)
        }

        for (const val of Object.values(this.mimes))
        {
            if (typeof val !== 'string')
            {
                throw new Error(`config.mimes must contain extension:mime key-value pairs`)
            }
        }

        // logfile

        if (this.logfile)
        {
            if (process.platform === 'win32') this.logfile = this.logfile.replace(/\\/g, '/')
        }

        // verbosity

        if (!['silent', 'normal', 'high', 'debug'].includes(this.verbosity))
        {
            throw `config.verbosity must be either one of: 'silent', 'normal', 'high', 'debug'`
        }
    }
}

class ReqRes
{
    id
    srv
    req
    res
    headers
    rel // relative path of the item in config.dir. no leading or trailing slashes
    abs // absolute path of the item
    logmsg

    constructor (srv, req, res)
    {
        this.id  = `#${ (srv.reqcount++).toString().padStart(3, '0') }`
        this.srv = srv
        this.req = req
        this.res = res
        
        this.headers = {}
        for (const key in srv.config.headers) this.headers[key] = srv.config.headers[key]

        const d = new Date()
        this.logmsg = `\n${ d.toLocaleTimeString('sv') }.${ d.getMilliseconds().toString().padStart(3, '0') } ${ this.id } ${ req.method } ${ req.url }\n------------`
    }

    send ()
    {
        // 405
        if (this.req.method !== 'GET')
        {
            this.#sendStatus(405, `method not allowed: ${ this.req.method }`)
            return
        }

        // 301
        for (const fn of this.srv.config.redirects)
        {
            const maybeRedirectURL = fn(this.req.url)

            if (maybeRedirectURL !== this.req.url)
            {
                this.logmsg += `\n[redirect]\n${ this.req.url }\n${ maybeRedirectURL }`
                this.headers.location = maybeRedirectURL
                this.#sendStatus(301, `redirecting to ${ maybeRedirectURL }`)
                return
            }
        }

        // matching url to file/dir

        let maybeDecodedURL = this.req.url
        try
        {
            maybeDecodedURL = decodeURIComponent(this.req.url)
        }
        catch {}

        this.rel = maybeDecodedURL.replace(/^\/+/, '').replace(/\/+$/, '')

        for (const fn of this.srv.config.rewrites)
        {
            let maybeRewritePath = fn(this.rel)
            if (maybeRewritePath !== this.rel)
            {
                maybeRewritePath = maybeRewritePath.replace(/^\//, '').replace(/\/$/, '')
                this.logmsg += `\n[rewrite]\n${ this.rel }\n${ maybeRewritePath }`
                this.rel = maybeRewritePath
                break
            }
        }

        this.abs = this.rel ? `${ this.srv.config.dir }/${ this.rel }` : this.srv.config.dir

        // autoindex
        if (this.srv.config.autoindex && fs.existsSync(`${ this.abs }/index.html`))
        {
            const indexhtmlRel = this.rel !== '' ? `${ this.rel }/index.html` : 'index.html'
            this.logmsg += `\n[autoindex]\n${ this.rel }\n${ indexhtmlRel }`
            this.rel = indexhtmlRel
            this.abs = `${ this.srv.config.dir }/${ this.rel }`
        }

        //

        this.abs = this.abs.replace(/^\/{2,}/, '/') // edge case when serving /
        this.logmsg += `\nrel: ${ this.rel }\nabs: ${ this.abs }`

        let stats
        try
        {
            stats = fs.statSync(this.abs)
        }
        catch (err)
        {
            if (err.code === 'ENOENT')
            {
                this.#sendStatus(404, 'not found')
            }
            else
            {
                this.#sendStatus(500, err.message)
            }

            return
        }

        if (stats.isFile())
        {
            this.#sendFile()
        }
        else if (stats.isDirectory())
        {
            if (this.srv.config.servedir)
            {
                this.#sendDir()
            }
            else
            {
                this.#sendStatus(400, 'the server is not configured to serve directories')
            }
        }
        else
        {
            this.#sendStatus(400, 'the requested item is not a file or directory')
        }
    }

    #sendStatus (code, msg)
    {
        this.logmsg += `\n[response = status]\ncode: ${ code }\ntext: ${ msg }`
        this.srv.log(this.logmsg)

        this.headers['content-type'] = 'text/plain'
        this.res.writeHead(code, this.headers)
        this.res.end(`${ code } : ${ msg }`)
    }

    #sendFile ()
    {
        this.logmsg += `\n[response = file]`
        this.srv.log(this.logmsg)

        const ext = path.parse(this.abs).ext.slice(1).toLowerCase()
        const mime = this.srv.config.mimes[ext] || mimes[ext]
        if (mime) this.headers['content-type'] = mime
        this.res.writeHead(200, this.headers)

        const stream = fs.createReadStream(this.abs)

        stream.on('data', chunk => this.res.write(chunk))

        stream.on('error', err =>
        {
            this.res.end()
            this.srv.log(`\nerror sending the file in request ${ this.id }: ${ err.message || err }\n`) // example: /proc/1/attr/apparmor/exec
        })

        stream.on('end', () =>
        {
            this.res.end()
            this.srv.log(`\n[debug] finished sending the file in request ${ this.id }\n`, 'debug')
        })
    }

    #sendDir ()
    {
        this.logmsg += `\n[response = dir]`
        this.srv.log(this.logmsg)

        const items = []
        for (const dirent of fs.readdirSync(this.abs, { withFileTypes: true }))
        {
            if (dirent.isFile() || dirent.isDirectory())
            {
                const stat = fs.statSync(`${ this.abs }/${ dirent.name }`)

                if (dirent.isFile())
                {
                    items.push({ type: 'file', name: dirent.name, size: stat.size, time: stat.ctime.toISOString() })
                }
                else if (dirent.isDirectory())
                {
                    let size
                    try
                    {
                        size = fs.readdirSync(`${ this.abs }/${ dirent.name }`).length
                    }
                    catch (err)
                    {
                        size = 'N/A'
                    }

                    items.push({ type: 'dir', name: dirent.name, size, time: stat.ctime.toISOString() })
                }
            }
            else
            {
                items.push({ type: 'etc', name: dirent.name })
            }
        }

        this.headers['content-type'] = 'text/html'
        this.res.writeHead(200, this.headers)
        this.res.end(dirview(this.srv.config.dir, this.rel, items))
    }
}

class xdHttpFileServer
{
    config
    #server
    #logfile
    reqcount = 0
    
    constructor (config)
    {
        this.config = new Config(config)

        if (this.config.logfile)
        {
            try
            {
                fs.mkdirSync(path.parse(this.config.logfile).dir, { recursive: true })
                this.#logfile = fs.createWriteStream(this.config.logfile)
            }
            catch (err)
            {
                throw new Error(`failed to create log file: ${ this.config.logfile }: ${ err.message || err }`)
            }
        }

        this.#server = http.createServer()
        this.#server.listen(this.config.port)
        this.log(`dir: ${ this.config.dir }`, 'normal')
        this.log(`url: http://localhost:${ this.config.port }`, 'normal')

        this.#server.addListener('request', (req, res) =>
        {
            const reqres = new ReqRes(this, req, res)

            try
            {
                reqres.send()
            }
            catch (err)
            {
                // 500
                if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' })
                res.end(`500 : ${ err.message }`)
                this.log(util.inspect(err), 'normal')
            }
        })
    }

    log (msg, level = 'normal')
    {
        if (
            level === 'normal' && this.config.verbosity !== 'silent' ||
            level === 'high'   && ['high', 'debug'].includes(this.config.verbosity) ||
            level === 'debug'  && this.config.verbosity === 'debug'
        )
        {
            console.log(msg)
            if (this.#logfile)
            {
                this.#logfile.write(msg)
                this.#logfile.write('\n')
            }
        }
    }

    stop ()
    {
        this.#server.close()
        if (this.#logfile) this.#logfile.end()
    }
}

module.exports = xdHttpFileServer