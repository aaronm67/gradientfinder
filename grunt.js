/*global module:false*/
module.exports = function(grunt) {

  grunt.initConfig({
    meta: {
      version: '0.1.1',
      banner: '/*! GradientFinder - v<%= meta.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' */'
    },
    lint: {
      files: ['grunt.js', 'gradientfinder.js']
    },
    exclude: '.git .gitignore build/** node_modules/** grunt.js package.json *.md'.split(' '),
    qunit: {
      files: ['tests/**/*.html']
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', 'gradientfinder.js'],
        dest: 'gradientfinder.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: false,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        loopfunc: true,
        undef: false,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        'console': true,
        'log': true
      }
    }
  });

  //grunt.registerTask('default', 'lint qunit min');
  grunt.registerTask('default', 'lint min');

};
