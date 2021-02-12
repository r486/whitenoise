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