module.exports = {
    apps: [
        {
            name: 'autopay', // Give your application a name
            script: './dist/index.js',
            node_args: '-r ts-node/register -r tsconfig-paths/register',
            env: {
                "TS_NODE_BASEURL": "./dist"
            },
            autorestart: true, // Ensure the app restarts on error
            restart_delay: 5000, // Optional: delay between restarts in milliseconds
            watch: false, // Optional: enable if you want to watch for file changes
        },
    ],
};
