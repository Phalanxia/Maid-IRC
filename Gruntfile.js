'use strict';

const grunt = require('grunt');

module.exports = function(grunt) {
	const pkg = grunt.file.readJSON('package.json');
	const version = pkg.version;

	grunt.initConfig({
		shell: {
			install: {
				options: {
					stdout: false,
					stderr: false,
					stdin: false,
				},
				command: 'npm install',
			},
			dist: {
				options: {
					stdout: true,
					stderr: true,
					stdin: false,
				},
				command: 'cd ./dist && npm install --production',
			},
		},

		concat: {
			options: {
				stripBanners: true,
			},
			dist: {
				src: [
					'public/js/modules/handlebars/Templates.js',
					'public/js/modules/Message.js',
					'public/js/modules/Interface.js',
					'public/js/modules/IncomingMessages.js',
					'public/js/modules/OutgoingMessages.js',
					'public/js/modules/NetworkConnect.js',
					'public/js/client.js',
				],
				dest: 'dist/public/built.js',
			},
			dependencies: {
				options: {
					banner: `/*! Maid-IRC - v${version} - ${grunt.template.today('yyyy-mm-dd')} */\n\n'use strict';\n\n`,
					stripBanners: true,
					process: function(src, filepath) {
						return '// Source: ' + filepath + '\n\n' + src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
					},
				},
				src: [
					// Libraries
					'public/js/lib/Autolinker.min.js',
					'public/js/lib/handlebars.runtime.min.js',
					'public/js/lib/twemoji.min.js',
					'public/js/lib/uuid.js',
					// Compiled core code
					'public/app.js',
					// Precompiled templates
					'public/js/modules/handlebars/compiled.js',
				],
				dest: 'public/app.js',
			},
		},

		babel: {
			options: {
				sourceMap: true,
				comments: false,
			},
			development: {
				files: {
					'public/app.js': 'dist/public/built.js',
				},
			},
			dist: {
				files: {
					'dist/public/app.js': 'dist/public/built.js',
				},
			},
		},

		clean: {
			beforeDist: {
				src: ['dist/**/*'],
			},
			dist: {
				src: ['build', 'dist/public/built.js'],
			},
			afterDist: {
				src: ['dist/**/*', `!dist/maid-irc_v${version}.zip`],
			},
		},

		copy: {
			dist: {
				files: [
					{
						expand: true,
						src: [
							'public/**',
							'!public/js/**',
							'!public/css/**',
							'views/**',
							'modules/**',
							'screenshots/**',
						],
						dest: 'dist',
					},
					{
						src: ['maid.js'],
						dest: 'dist/maid.js',
					},
					{
						src: ['config.js'],
						dest: 'dist/config.js',
					},
					{
						src: ['package.json'],
						dest: 'dist/package.json',
					},
					{
						src: ['README.md'],
						dest: 'dist/README.md',
					},
					{
						src: ['LICENSE'],
						dest: 'dist/LICENSE',
					},
				]
			},
			final: {
				files: [
					{
						src: ['public/app.js'],
						dest: 'dist/public/app.js',
					},
				]
			},
		},

		less: {
			development: {
				options: {
					paths: [],
				},
				files: {
					'public/css/client.css': 'less/client.less',
				},
			},
			dist: {
				options: {
					paths: [],
					plugins: [],
					compress: true,
					optimization: 0,
				},
				files: {
					'dist/public/css/client.css': 'less/client.less',
				},
			},
		},

		compress: {
			dist: {
				options: {
					archive: `dist/maid-irc_v${version}.zip`,
				},
				files: [
					{
						expand: true,
						cwd: './dist',
						src: ['**'],
					}
				],
			},
		},

		watch: {
			less: {
				files: ['less/*.less'],
				tasks: ['build:css'],
				options: {
					span: false,
				},
			},
			scripts: {
				files: [
					'public/js/**/*.js',
					'!public/js/modules/handlebars/compiled.js',
					'public/views/**/*.hbs'
				],
				tasks: ['handlebars:compile', 'build:js'],
				options: {
					span: false,
				},
			},
			handlebars: {
				files: ['public/views/**/*.hbs'],
				tasks: ['handlebars:compile'],
				options: {
					span: false,
				},
			},
		},

		handlebars: {
			options: {
				namespace: 'client.Templates',
				wrapped: true,
			},
			compile: {
				files: {
					'public/js/modules/handlebars/compiled.js': ['public/views/**/*.hbs'],
				},
			},
		},
	});

	// Load grunt contribution tasks
	grunt.loadNpmTasks('grunt-contrib-handlebars');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');

	// Load third-party tasks
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-babel');

	// Override default tasks or some magic
	grunt.registerTask('default', []);

	grunt.registerTask('install', function() {
		grunt.log.writeln('Installing Dependencies');
		grunt.task.run(['shell:install']);
	});

	grunt.registerTask('build:js', function() {
		grunt.log.writeln(`Compiling Maid-IRC's public javascript`);
		grunt.task.run([
			'concat:dist',
			'babel:development',
			'handlebars:compile',
			'concat:dependencies',
			'clean:dist',
		]);
	});

	grunt.registerTask('build:css', function() {
		grunt.log.writeln(`Compiling Maid-IRC's less files`);
		grunt.task.run([
			'less:development',
		]);
	});

	grunt.registerTask('build:handlebars', function() {
		grunt.log.writeln(`Compiling Maid-IRC's handlebars files`);
		grunt.task.run([
			'handlebars:compile',
		]);
	});

	grunt.registerTask('package', function() {
		grunt.log.writeln('Packaging Maid-IRC');
		grunt.task.run([
			'clean:beforeDist',
			'copy:dist',
			'concat:dist',
			'babel:dist',
			'handlebars:compile',
			'concat:dependencies',
			'copy:final',
			'less:dist',
			'clean:dist',
			'shell:dist',
			'compress:dist',
			'clean:afterDist',
		]);
	});

	grunt.registerTask('watch:js', function() {
		grunt.log.writeln('Watching .js files in public/js');
		grunt.task.run([
			'watch:scripts',
		]);
	});

	grunt.registerTask('watch:less', function() {
		grunt.log.writeln('Watching .less files in less');
		grunt.task.run([
			'watch:less',
		]);
	});

	grunt.registerTask('watch:handlebars', function() {
		grunt.log.writeln('Watching .hbs files (Handlebar templates) in public/views');
		grunt.task.run([
			'watch:handlebars',
		]);
	});
};
