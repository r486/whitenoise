'use strict' // 2021-02-10 13.14

const path = require('path')
const nodesass = require('node-sass')
const xdDirScan = require('./util/xdDirScan')
const xdFileWrite = require('./util/xdFileWrite')
const xdStringFilter = require('./util/xdStringFilter')
const Config = require('./Config')

module.exports = function tsk_scss (cfg)
{
    const config = new Config(cfg)
    if (process.argv.includes('-debug')) console.log(config)

    const cwd = process.platform === 'win32' ? process.cwd().replace(/\\/g, '/') : process.cwd()
    const abspathSourcedir = `${ cwd }/${ config.sourceDir }`

    //

    const srcs = xdDirScan(abspathSourcedir, 'files')
        .map(path => `${ config.sourceDir }/${ path }`)
        .filter(path => xdStringFilter(path, { whitelist: config.whitelist, blacklist: config.blacklist }))
    const dsts = []

    for (const relpathSrc of srcs)
    {
        const ppath = path.posix.parse(relpathSrc)
        const dir   = ppath.dir
        const name  = ppath.name
        const ext   = ppath.ext.replace(/^\.+/, '')
        const relpathDst = config.dstPathFn(dir, name, ext)
        console.log(`src: ${ relpathSrc }\ndst: ${ relpathDst }`)
        if (dsts.includes(relpathSrc)) throw `duplicate destination path`
        dsts.push(relpathSrc)

        try
        {
            const css = nodesass.renderSync({ file: `${ cwd }/${ relpathSrc }`, includePaths: [abspathSourcedir] }).css.toString()
            xdFileWrite(`${ cwd }/${ relpathDst }`, css)
        }
        catch (err)
        {
            throw `failed: ${ err.message }`
        }
    }

    console.log(`${ srcs.length } ${ srcs.length === 1 ? 'file' : 'files' }`)
}