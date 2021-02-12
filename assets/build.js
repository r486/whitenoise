

/* lib/whitenoise/frontend/_common/header/script.js */

// sizing the logo to the header text
// this could be done with CSS, but ¯\_(ツ)_/¯

;(() =>
{
    'use strict'

    const fn = () =>
    {
        const size = getComputedStyle(document.querySelector('.header_text')).width
        const logo = document.querySelector('.header_logo')
        logo.style.width = size
        logo.style.height = size
    }

    window.addEventListener('DOMContentLoaded', fn)
    window.addEventListener('resize', fn)
})();

/* lib/whitenoise/frontend/_common/menu/script.js */

;(() =>
{
    window.addEventListener('load', () =>
    {
        const menu = document.querySelector('.menu')
        const height = getComputedStyle(menu).height
        let prev = 0

        window.addEventListener('scroll', () =>
        {
            const curr = window.pageYOffset
            const diff = curr - prev

            if (diff < -50 || window.innerHeight + window.pageYOffset >= document.body.offsetHeight)
            {
                menu.style.top = '0'
                prev = curr
            }
            else if (diff > 50)
            {
                menu.style.top = `-${ height }`
                prev = curr
            }
        })
    })
})();