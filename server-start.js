// Transpile all code following this line with babel and use 'env' (aka ES6) preset.
require('babel-register')({
    presets: [ 'env' ]
})

require('babel-polyfill');
require('./server.js');

// Thank you https://timonweb.com/posts/how-to-enable-es6-imports-in-nodejs/
// Thank you https://stackoverflow.com/a/44170434/1313757
