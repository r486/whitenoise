'use strict'
const header = require('./_common/header')
const menu = require('./_common/menu')
const footer = require('./_common/footer')

module.exports = (entry) =>
{
    return `\
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <base href="/whitenoise/">
    <link rel="stylesheet" href="assets/build.css">
    <title>${ entry.title }</title>
</head>
<body>

    <div class="root">
    
        ${ header() }
        ${ menu() }
        
        <div class="page_content">
            ${ entry.html }
        </div>
        
        ${ footer() }
    
    </div>
    
    <script src="assets/build.js"></script>
</body>
</html>    
    `
}