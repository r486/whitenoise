'use strict' // 2021-02-11 10.50

const fs = require('fs')
const xdDirScan = require('./util/xdDirScan')
const xdFileWrite = require('./util/xdFileWrite')
const xdStringFilter = require('./util/xdStringFilter')
const Config = require('./Config')

module.exports = function tsk_glue_files (cfg)
{
    const config = new Config(cfg)
    if (process.argv.includes('-debug')) console.log(config)

    const cwd = process.platform === 'win32' ? process.cwd().replace(/\\/g, '/') : process.cwd()
    const abspathOutfile = `${ cwd }/${ config.outputFile }`

    //

    const paths = xdDirScan(`${ cwd }/${ config.sourceDir }`, 'files')
        .map(path => `${ config.sourceDir }/${ path }`)
        .filter(path => xdStringFilter(path, { whitelist: config.whitelist, blacklist: config.blacklist }))
    let contents = ''

    for (const relpath of paths)
    {
        console.log(relpath)
        if (config.header) contents += config.header(relpath)
        contents += fs.readFileSync(`${ cwd }/${ relpath }`)
    }

    if (fs.existsSync(abspathOutfile))
    {
        console.log(`output file already exists. merging`)
        contents = fs.readFileSync(abspathOutfile) + contents
    }
    xdFileWrite(abspathOutfile, contents)
    console.log(`${ paths.length } ${ paths.length === 1 ? 'file' : 'files' } -> ${ config.outputFile }`)
}