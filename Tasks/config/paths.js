var path    = {
    cwd     : '../',
    resources : 'Resources/',
    root    : {},
    js      : {},
    scss     : {}
}

path.build  = path.resources + 'build/'
path.bower  = path.resources + 'bower_components/'

// Root of respective resource types
path.root = {
    js : path.resources + 'js/',
    scss : path.resources + 'scss/',
}

// =====
// #scss
// =====
path.scss = {
    watch   : path.root.scss + '**/*.scss',
    src     : path.root.scss + 'main.scss',
};

// ==========
// #js
// ==========

path.js = {
// Build files
    build    : 'build.js',

// Files to be watched and linted
    watch    : path.root.js + '**/*.js',
}

path.js.src = [
    path.root.js + 'main.js'
];

path.js.lib = [
    path.bower + 'jquery/dist/jquery.js',
    path.bower + 'underscore/underscore.js',
    path.bower + 'backbone/backbone.js',
    path.bower + 'backbone.localStorage/backbone.localStorage.js'
];

path.js.all = path.js.lib.concat(path.js.src)

module.exports = path;