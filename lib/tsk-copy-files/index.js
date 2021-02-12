'use strict' // 2021-02-09 13.44

const fs = require('fs')
const path = require('path')
const xdDirScan = require('./util/xdDirScan')
const xdFsCopy = require('./util/xdFsCopy')
const xdStringFilter = require('./util/xdStringFilter')
const Config = require('./Config')

module.exports = function tskCopyFiles (cfg)
{
    const config = new Config(cfg)
    if (process.argv.includes('-debug')) console.log(config)

    const cwd = process.platform === 'win32' ? process.cwd().replace(/\\/g, '/') : process.cwd()

    //

    const paths = xdDirScan(`${ cwd }/${ config.sourceDir }`, 'files')
        .map(path => `${ config.sourceDir }/${ path }`)
        .filter(path => xdStringFilter(path, { whitelist: config.whitelist, blacklist: config.blacklist }))

    let copied = 0
    let skipped = 0
    const dsts = []

    for (const relpathSrc of paths)
    {
        const ppath = path.posix.parse(relpathSrc)
        const dir   = ppath.dir
        const name  = ppath.name
        const ext   = ppath.ext.replace(/^\.+/, '')
        const relpathDst = config.dstPathFn(dir, name, ext)
        console.log(`src: ${ relpathSrc }\ndst: ${ relpathDst }`)
        if (dsts.includes(relpathSrc)) throw `duplicate destination path`
        dsts.push(relpathSrc)

        const abspathSrc = `${ cwd }/${ relpathSrc }`
        const abspathDst = `${ cwd }/${ relpathDst }`

        if (config.overwrite || !fs.existsSync(abspathDst))
        {
            xdFsCopy(abspathSrc, abspathDst)
            copied++
        }
        else
        {
            skipped++
        }
    }

    console.log(`copied:  ${ copied }\nskipped: ${ skipped }`)
}

