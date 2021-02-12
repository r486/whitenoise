exports.build =
[
    {
        module: 'lib/init'
    },
    {
        module: 'lib/tsk-read-yamd',
        config:
        {
            sourceDir: `source`,
            whitelist: [/\.md$/i],
            blacklist: [],
            outputFile: `tmp/entries.json`
        }
    },
    {
        module: 'lib/tsk-scss',
        config:
        {
            sourceDir: `lib/whitenoise/frontend`,
            whitelist: [/\.s[ac]+ss$/i],
            blacklist: [],
            dstPathFn: (dir, name, ext) => `${ dir }/${ name }.css`,
        }
    },
    {
        module: 'lib/tsk-glue-files',
        config:
        {
            sourceDir: `lib/whitenoise/frontend`,
            whitelist: [/\.css$/i],
            blacklist: [],
            outputFile: `output/assets/build.css`,
            header: path => `\n\n/* ${ path } */\n\n`
        }
    },
    {
        module: 'lib/tsk-glue-files',
        config:
        {
            sourceDir: `lib/whitenoise/frontend`,
            whitelist: [/\.js$/i],
            blacklist: [/index\.js$/i],
            outputFile: `output/assets/build.js`,
            header: path => `\n\n/* ${ path } */\n\n`
        }
    },
    {
        module: 'lib/tsk-copy-files',
        config:
        {
            sourceDir: `source`,
            whitelist: [/\.png$/i],
            blacklist: [],
            dstPathFn: (dir, name, ext) => `${ dir.replace('source', 'output') }/${ name }.${ ext }`,
            overwrite: false
        }
    },
    {
        module: 'lib/whitenoise'
    },
    {
        module: 'lib/tsk-serve',
        config:
        {
            dir: `output`,
            port: 1337,
            redirects: [url => url === '/' ? '/whitenoise' : url],
            rewrites: [path => path.replace('whitenoise', '')],
            autoindex: true
        }
    }
]