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
            files: ['index.html']
        },
        exclude: '.git .gitignore build/** node_modules/** grunt.js package.json *.md'.split(' '),
        lint: {
            files: ['grunt.js', 'js/**/*.js', 'test/**/*.js']
        },
        concat: {
            framework: {
                src: ['<banner:meta.bannerJquery>', 'static/jquery-1.7.2.min.js', 'static/jquery-ui.js', 'static/tinycolor.js', 'static/utils.js', 'static/plugin/*.js' ],
                dest: 'compiled/framework.js'
            },
            demo: {
                src: ['<banner:meta.bannerFinder>', 'static/filereader.js', 'static/demo.js' ],
                dest: 'compiled/demo.js'
            }
        },
        min: {
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
    };

    grunt.registerTask('default', 'lint copy usemin concat min');
};
