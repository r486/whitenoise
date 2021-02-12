'use strict'

const fs = require('fs')

module.exports = function init ()
{
    for (const dir of [`output`, `tmp`])
    {
        const abs = `${ process.cwd() }/${ dir }`

        if (fs.existsSync(abs))
        {
            fs.rmSync(abs, { recursive: true })
            console.log(`removed ./${ dir }`)
        }

        fs.mkdirSync(abs)
        console.log(`created ./${ dir }`)
    }
}