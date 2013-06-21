/*global module:false*/
module.exports = function(grunt) {
    var staging ='intermediate/';
    var output = 'publish/';

    // Project configuration.
    grunt.initConfig({
        meta: {
            version: '0.1.0',
            bannerGrad: '/*! Gradient Generator Concept - v<%= meta.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '* http://briangrinstead.com/gradient/\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
                'Brian Grinstead */',
            bannerFinder: '/*GradientFinder - Copyright (c) 2012 Aaron Marasco https://github.com/aaronm67/gradientfinder/raw/master/LICENSE\n\
    FileReader.js - Copyright 2012 Brian Grinstead - MIT License. http://github.com/bgrins/filereader.js */',
            bannerJquery: '/*! jQuery v1.7.2 jquery.com | jquery.org/license\n\
            TinyColor.js - <https://github.com/bgrins/TinyColor> - 2011 Brian Grinstead - v0.5 */'
        },
        staging: staging,
        output: output,
        usemin: {
            html: ['./index.html']
        },
        exclude: '.git .gitignore build/** node_modules/** grunt.js package.json *.md'.split(' '),
        lint: {
            files: ['grunt.js', 'js/**/*.js', 'test/**/*.js']
        },
        concat: {
            finder: {
                src: ['gradientfinder.js' ],
                dest: 'compiled/gradientfinder.min.js'
            },
            framework: {
                src: ['static/jquery-1.7.2.min.js', 'static/jquery-ui.js' ],
                dest: 'compiled/framework.js'
            },
            plugin: {
                src: ["static/plugin/filereader.js","static/plugin/tinycolor.js","static/plugin/keymaster.js","static/plugin/prefixfree.js","static/plugin/spectrum.js","static/plugin/ui.anglepicker.js","static/plugin/utils.js","static/plugin/webkit-utils.js","static/gradientgenerator.js"],
                dest: 'compiled/plugin.js'
            },
            demo: {
                src: [ 'static/demo.js' ],
                dest: 'compiled/demo.js'
            }
        },
        min: {
            finder: {
                src: ['<banner:meta.bannerFinder>', '<config:concat.finder.dest>'],
                dest: 'compiled/gradientfinder.min.js'
            },
            plugin: {
                src: ['<config:concat.plugin.dest>'],
                dest: 'compiled/plugin.js'
            },
            framework: {
                src: ['<banner:meta.bannerJquery>', '<config:concat.framework.dest>'],
                dest: 'compiled/framework.js'
            },
            demo: {
                src: ['<banner:meta.bannerFinder>', '<config:concat.demo.dest>'],
                dest: 'compiled/demo.js'
            }
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                multistr: true
            },
            globals: {
                jQuery: true
            }
        },
        uglify: {
            mangle: {toplevel: true}
        }
    });

    grunt.loadNpmTasks('node-build-script');
    grunt.registerTask("copy", "copy files", function() {
        grunt.file.copy("index_dev.html", "index.html");
    });

    grunt.registerTask('default', 'lint copy concat usemin');
};
