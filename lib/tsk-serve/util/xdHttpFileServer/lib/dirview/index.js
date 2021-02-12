'use strict'

const fs = require('fs')
const style = fs.readFileSync(__dirname + '/style.css', 'utf8')

var formatBytes = function (b)
{
    if      (b < 1024)
    {
        return b + ' B'
    }
    else if (b < 1024 * 1024)
    {
        return (b / 1024).toFixed(2) + ' K' // kib
    }
    else if (b < 1024 * 1024 * 1024)
    {
        return (b / 1024 / 1024).toFixed(2) + ' M' // mib
    }
    else
    {
        return (b / 1024 / 1024 / 1024).toFixed(2) + ' G' // gib
    }
}

var formatDate = function (date)
{
    if (typeof date === 'string') date = new Date(date)
    return `${ date.getFullYear() }-${ (date.getMonth() + 1).toString().padStart(2, '0') }-${ date.getDate().toString().padStart(2, '0') } ${ date.getHours().toString().padStart(2, '0') }:${ date.getMinutes().toString().padStart(2, '0') }`
}

module.exports = function dirview (root, path, items)
{
    path = path.replace(/^\//, '').replace(/\/$/, '')

    // breadcrumbs
    let breadcrumbs
    if (path)
    {
        breadcrumbs = `<a href="/">${ root }</a>`
        const split = path.split('/')
        for (let i = 0; i < split.length; i++)
        {
            if (!(root === '/' && i === 0)) breadcrumbs += `<span>/</span>`
            breadcrumbs += `<a ${ i === split.length - 1 ? `class="active"` : '' } href="/${ split.slice(0, i + 1).join('/') }">${ split[i] }</a>`
        }
    }
    else
    {
        breadcrumbs = `<a class="active" href="/">${ root }</a>`
    }
    breadcrumbs = `<div class="breadcrumbs">${ breadcrumbs }</div>`

    // up
    let up
    if (path)
    {
        const href = path.indexOf('/') !== -1 ? `/${ path.slice(0, path.lastIndexOf('/')) }` : '/'
        //up = `<tr><td class="name"><a class="dir" style="font-weight: normal !important; color: rgba(129,129,129,0.5) !important;" href="${ href }">..</a></td><td><a class="dir" href="${ href }">&nbsp;</a></td><td class="date"><a class="dir date" href="${ href }">&nbsp;</a></td></tr>`
        up = `<tr><td colspan="3" class="name"><a href="${ href }">..</a></td></tr>`
    }
    else
    {
        up = ''
    }

    // items
    let dirs = ``
    let files = ``
    let etc = ``

    for (const item of items)
    {
        if (item.type === 'dir')
        {
            const url = path ? `/${ path }/${ item.name }` : `/${ item.name }`

            if (item.size !== 'N/A')
            {
                dirs += `
                <tr>
                    <td class="bold">
                        <a href="${ url }">${ item.name }</a>
                    </td>
                    <td class="bold">
                        <a href="${ url }">${ item.size }</a>
                    </td>
                    <td class="bold">
                        <a href="${ url }">${ formatDate(item.time) }</a>
                    </td>
                </tr>`
            }
            else
            {
                dirs += `
                <tr>
                    <td class="bold gray">
                        ${ item.name }
                    </td>
                    <td class="bold gray">
                        ${ item.size }
                    </td>
                    <td class="bold gray">
                        ${ formatDate(item.time) }
                    </td>
                </tr>`
            }
        }
        else if (item.type === 'file')
        {
            const url = path ? `/${ path }/${ item.name }` : `/${ item.name }`
            files += `
            <tr>
                <td class="name">
                    <a class="file" href="${ url }">${ item.name }</a>
                </td>
                <td>
                    <a class="file" href="${ url }">${ formatBytes(item.size) }</a>
                </td>
                <td class="date">
                    <a class="file date" href="${ url }">${ formatDate(item.time) }
                </td>
            </tr>`
        }
        else
        {
            // TODO
        }
    }

    //

    return `\
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${ path || '/' }</title>
    <style>
        ${ style }
    </style>
</head>
<body>

    <div class="main">
        ${ breadcrumbs }
        <hr>
        <table>
            <tbody>
                ${ up }
                ${ dirs }
                ${ files }
                ${ etc }
            </tbody>
        </table>   
    </div>
     
</body>
</html>`
}