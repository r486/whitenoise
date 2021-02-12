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