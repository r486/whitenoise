'use strict'

const { xdFileWrite } = require('./util/xdFileWrite')

module.exports = function whitenoise ()
{
    const template = require('./frontend')
    const entries = require(`${ process.cwd() }/tmp/entries.json`)

    for (const entry of entries)
    {
        if (!entry.title)
        {
            const match = entry.html.match(/<h1.*>(.*)<\/h1>/i)

            if (match)
            {
                entry.title = match[1]
            }
            else
            {
                throw `failed to determine the title of entry ${ entry.path }`
            }
        }

        const outputPathRel = entry.path.replace('source', 'output').replace(/\.md$/i, '.html')
        console.log(outputPathRel)
        xdFileWrite(`${ process.cwd() }/${ outputPathRel }`, template(entry))
    }
}