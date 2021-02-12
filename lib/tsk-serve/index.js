'use strict' // 2021-02-09 14.29

const xdHttpFileServer = require('./util/xdHttpFileServer')

module.exports = function tskServe (cfg)
{
    cfg.dir = process.cwd() + '/' + cfg.dir
    new xdHttpFileServer(cfg)
}