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
				banner: `/*! Maid-IRC - v${version} - ${grunt.template.today('yyyy-mm-dd')} */`,
			},
			dist: {
				src: [
					'public/js/modules/services/Templates.js',
					'public/js/modules/IncomingMessages.js',
					'public/js/modules/OutgoingMessages.js',
					'public/js/modules/NetworkConnect.js',
					'public/js/modules/Interface.js',
					'public/js/client.js',
				],
				dest: 'dist/public/built.js',
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
							'public/js/lib/**',
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
				files: ['public/js/*.js'],
				tasks: ['build:js'],
				options: {
					span: false,
				},
			},
		},
	});

	// Load grunt contribution tasks
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
		grunt.log.writeln("Compiling Maid-IRC's public javascript");
		grunt.task.run([
			'concat:dist',
			'babel:development',
			'clean:dist',
		]);
	});

	grunt.registerTask('build:css', function() {
		grunt.log.writeln("Compiling Maid-IRC's less files");
		grunt.task.run([
			'less:development',
		]);
	});

	grunt.registerTask('package', function() {
		grunt.log.writeln('Packaging Maid-IRC');
		grunt.task.run([
			'clean:beforeDist',
			'copy:dist',
			'concat:dist',
			'babel:dist',
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
		grunt.task.run([
			'watch:less',
		]);
	});
};
