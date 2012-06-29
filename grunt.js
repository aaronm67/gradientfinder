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
        TinyColor.js - <https://github.com/bgrins/TinyColor> - 2011 Brian Grinstead - v0.5 */',
        closureStart: '(function(exports) {',
        closureEnd: '})(window);',
        makeGlobal: '\nexports.Generator = Generator;'
    },
    staging: staging,
    output: output,
    usemin: {
      files: ['dist/index.html']
    },
    exclude: '.git .gitignore build/** node_modules/** grunt.js package.json *.md'.split(' '),
    mkdirs: {
      staging: '<config:exclude>',
      output: '<config:exclude>'
    },
    rev: {
      js: 'publish/dist/compiled/js/*.js',
      css: 'publish/dist/compiled/css/*.css',
      img: 'publish/dist/img/**'
    },
    lint: {
      files: ['grunt.js', 'js/**/*.js', 'test/**/*.js']
    },
    qunit: {
      files: ['test/**/*.html']
    },
    concat: {
      framework: {
        src: ['<banner:meta.bannerJquery>', 'static/jquery-1.7.2.min.js', 'static/jquery-ui.js', 'static/tinycolor.js', 'static/utils.js', 'static/plugin/*.js' ],
        dest: 'dist/compiled/framework.js'
      },
      demo: {
        src: ['<banner:meta.bannerFinder>', 'static/filereader.js', 'static/demo.js' ],
        dest: 'dist/compiled/demo.js'
      },

      // Wrap compiled code in a closure and expose the required methods
      gradient: {
        src: ['<banner:meta.bannerGrad>', '<banner:meta.closureStart>', 'static/gradientgenerator.js',  'compiled/js/undo.js', 'compiled/js/ui.anglepicker.js', 'compiled/js/gradient.js', 'compiled/js/gradientpicker.js','<banner:meta.makeGlobal>', '<banner:meta.closureEnd>' ],
        dest: 'dist/compiled/gradient.js'
      }
    },
    min: {
      framework: {
          src: ['<banner:meta.bannerJquery>', '<config:concat.framework.dest>'],
          dest: 'dist/compiled/framework.js'
      },
      demo: {
          src: ['<banner:meta.bannerFinder>', '<config:concat.demo.dest>'],
          dest: 'dist/compiled/demo.js'
      },
      gradient: {
        src: ['<banner:meta.bannerGrad>', '<config:concat.gradient.dest>'],
        dest: 'dist/compiled/gradient.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
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
        browser: true
      },
      globals: {
        jQuery: true
      }
    },
    uglify: {
      mangle: {toplevel: true}
    }
  }
);

    grunt.loadNpmTasks('node-build-script');
    grunt.registerTask("copy", "copy files",  function() {
        var files = grunt.file.expandFiles([ "gradients/*", "img/*", "static/*",  "gradientfinder.js", "index.html" ]);
        files.forEach(function(file) {
            grunt.file.copy(file, "dist/" + file);
        });
    });

  grunt.registerTask('default', 'copy usemin concat min');
};
