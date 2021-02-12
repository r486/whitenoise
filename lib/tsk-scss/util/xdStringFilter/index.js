'use strict' // 2020-08-26 15.15

function xdStringFilter (string, opts = {})
{
    // whitelist

    if (opts.whitelist)
    {
        let pass = false

        for (const re of opts.whitelist)
        {
            if (re.test(string))
            {
                pass = true
                break
            }
        }

        if (!pass) return false
    }

    // blacklist

    if (opts.blacklist)
    {
        for (const re of opts.blacklist)
        {
            if (re.test(string))
            {
                return false
            }
        }
    }

    //

    return true
}

module.exports = xdStringFilter