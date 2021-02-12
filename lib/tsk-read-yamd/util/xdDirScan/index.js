'use strict' // 2021-01-17 19.39

const fs = require('fs')

function xdDirScan (dirPathAbs, type = 'all', __origin, __isRecursiveCall = false, __itemList = [])
{
    if (!__isRecursiveCall)
    {
        if (process.platform === 'win32')
        {
            dirPathAbs = dirPathAbs.replace(/\\/g, '/')
        }

        __origin = dirPathAbs = dirPathAbs.replace(/\/$/, '')
    }

    for (const dirent of fs.readdirSync(dirPathAbs, { withFileTypes: true }))
    {
        const itemName    = dirent.name
        const itemPathAbs = dirPathAbs + '/' + itemName
        const itemPathRel = itemPathAbs.slice(__origin.length + 1)

        if (dirent.isDirectory())
        {
            if (type === 'all' || type === 'dirs')
            {
                __itemList.push(itemPathRel)
            }

            xdDirScan(itemPathAbs, type, __origin, true, __itemList)
        }
        else if (type === 'all' || type === 'files')
        {
            __itemList.push(itemPathRel)
        }
    }

    return __itemList
}

module.exports = xdDirScan